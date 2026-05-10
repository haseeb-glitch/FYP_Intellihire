from fastapi import APIRouter, HTTPException, Depends, status
from starlette.requests import HTTPConnection
from pydantic import BaseModel, EmailStr
from typing import Optional
import jwt
import datetime
import random
import re
import secrets
import string
import smtplib
import ssl
from email.message import EmailMessage
from functools import wraps
import mongoengine as db
from backend.models.user import User
from backend.config import Config

auth_router = APIRouter()

USERNAME_REGEX = re.compile(r"^[A-Za-z][A-Za-z._-]*$")
PASSWORD_UPPER_REGEX = re.compile(r"[A-Z]")
PASSWORD_DIGIT_REGEX = re.compile(r"\d")
PASSWORD_SPECIAL_REGEX = re.compile(r"[!@#$%^&*(),.?\":{}|<>]")

# Pydantic Models for Validation
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str


def is_valid_username(username: str) -> bool:
    return bool(USERNAME_REGEX.match(username))


def is_strong_password(password: str) -> bool:
    return (
        bool(PASSWORD_UPPER_REGEX.search(password)) and
        bool(PASSWORD_DIGIT_REGEX.search(password)) and
        bool(PASSWORD_SPECIAL_REGEX.search(password))
    )


def generate_otp() -> str:
    return f"{random.randint(100000, 999999)}"


def send_email(recipient: str, subject: str, body: str, html_body: str | None = None) -> bool:
    if not Config.EMAIL_HOST or not Config.EMAIL_USER or not Config.EMAIL_PASSWORD:
        print(f"[OTP EMAIL] SMTP not configured; OTP content for {recipient}: {body}")
        return False

    message = EmailMessage()
    message['Subject'] = subject
    message['From'] = f"{Config.EMAIL_FROM_NAME} <{Config.EMAIL_FROM}>"
    message['To'] = recipient
    message['Reply-To'] = Config.EMAIL_REPLY_TO
    message['X-Mailer'] = 'Python smtplib'

    message.set_content(body)
    if html_body:
        message.add_alternative(html_body, subtype='html')

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(Config.EMAIL_HOST, Config.EMAIL_PORT, timeout=20) as server:
            if Config.EMAIL_USE_TLS:
                server.starttls(context=context)
            server.login(Config.EMAIL_USER, Config.EMAIL_PASSWORD)
            server.send_message(message)
        return True
    except Exception as e:
        print(f"[OTP EMAIL] Email send failed: {str(e)}")
        return False


def issue_otp_for_user(user: User) -> str:
    otp = generate_otp()
    now = datetime.datetime.utcnow()
    user.otp_code = otp
    user.otp_sent_at = now
    user.otp_expires_at = now + datetime.timedelta(minutes=10)
    user.save()
    return otp


def dispatch_otp_email(user: User) -> str:
    otp = issue_otp_for_user(user)
    subject = 'Your IntelliHire verification code'
    body = (
        f'Hi {user.username},\n\n'
        f'Your IntelliHire verification code is: {otp}\n'
        'Enter this code on the verification screen to complete your signup.\n\n'
        'If you did not request this code, please ignore this email.\n\n'
        'Thanks,\nIntelliHire Team'
    )
    html_body = (
        f'<html><body style="font-family:Arial,sans-serif;color:#111;line-height:1.6;">'
        f'<div style="max-width:600px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;">'
        f'<h2 style="color:#1d4ed8;margin-bottom:12px;">IntelliHire verification code</h2>'
        f'<p>Hi {user.username},</p>'
        f'<p>Your IntelliHire verification code is:</p>'
        f'<p style="font-size:24px;font-weight:700;letter-spacing:0.08em;margin:18px 0;">{otp}</p>'
        f'<p>Enter this code on the verification screen to complete your signup.</p>'
        f'<p style="margin-top:20px;color:#6b7280;">If you did not request this code, please ignore this email.</p>'
        f'<p style="margin-top:28px;">Thanks,<br/>The IntelliHire Team</p>'
        f'</div></body></html>'
    )
    if send_email(user.email, subject, body, html_body):
        return otp
    return otp

# Token Dependency
async def get_current_user(request: HTTPConnection):
    token = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(" ")[1]
    if not token:
        token = request.query_params.get('token')

    if not token:
        raise HTTPException(status_code=401, detail="Token is missing!")

    try:
        data = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
        current_user = User.objects(id=data['user_id']).first()
        if not current_user:
            raise HTTPException(status_code=401, detail="User not found!")
        return current_user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token is invalid! {str(e)}")

class SendOtpRequest(BaseModel):
    email: EmailStr

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ProfileUpdateRequest(BaseModel):
    username: str
    full_name: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


def generate_temp_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits + '!@#$%^&*()'
    while True:
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        if (re.search(r'[A-Z]', password) and re.search(r'[a-z]', password)
                and re.search(r'\d', password) and re.search(r'[!@#$%^&*()]', password)):
            return password


@auth_router.post('/register', status_code=201)
async def register(user_data: UserRegister):
    if not is_valid_username(user_data.username):
        raise HTTPException(
            status_code=400,
            detail="Username must start with a letter and cannot contain digits."
        )

    if User.objects(username=user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
        
    if User.objects(email=user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    if len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    if not is_strong_password(user_data.password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one uppercase letter, one digit, and one special character."
        )
        
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        email_verified=False
    )
    new_user.set_password(user_data.password)
    new_user.save()

    otp = dispatch_otp_email(new_user)
    return {
        "message": "Registration successful. Please verify the OTP sent to your email.",
        "email": new_user.email,
        "otp_sent": True,
        "otp": otp if not Config.EMAIL_HOST else None
    }


@auth_router.post('/send-otp')
async def send_otp(payload: SendOtpRequest):
    user = User.objects(email=payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    if user.email_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    otp = dispatch_otp_email(user)
    return {"message": "OTP sent to your email.", "otp": otp if not Config.EMAIL_HOST else None}


@auth_router.post('/forgot-password')
async def forgot_password(payload: ForgotPasswordRequest):
    user = User.objects(email=payload.email).first()
    if not user:
        # Avoid user enumeration by returning a generic message
        return {"message": "If this email exists, a temporary password has been sent."}

    temp_password = generate_temp_password()
    user.set_password(temp_password)
    user.save()

    subject = 'Your IntelliHire temporary password'
    body = (
        f'Hi {user.username},\n\n'
        f'Your temporary IntelliHire password is: {temp_password}\n'
        'Use this password to log in, then change it after signing in.\n\n'
        'If you did not request this, please contact support.\n\n'
        'Thanks,\nIntelliHire Team'
    )
    html_body = (
        f'<html><body style="font-family: Arial, sans-serif; color: #111; line-height: 1.6;">'
        f'<div style="max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">'
        f'<h2 style="color: #1d4ed8; margin-bottom: 12px;">IntelliHire temporary password</h2>'
        f'<p>Hi {user.username},</p>'
        f'<p>Your temporary IntelliHire password is:</p>'
        f'<p style="font-size: 24px; font-weight: 700; letter-spacing: 0.08em; margin: 18px 0;">{temp_password}</p>'
        f'<p>Use this password to log in, then change it after signing in.</p>'
        f'<p style="margin-top: 20px; color: #6b7280;">If you did not request this, please contact support.</p>'
        f'<p style="margin-top: 28px;">Thanks,<br/>The IntelliHire Team</p>'
        f'</div></body></html>'
    )
    send_email(user.email, subject, body, html_body)
    return {"message": "If this email exists, a temporary password has been sent."}


@auth_router.put('/profile')
async def update_profile(payload: ProfileUpdateRequest, current_user: User = Depends(get_current_user)):
    if not is_valid_username(payload.username):
        raise HTTPException(status_code=400, detail="Username must start with a letter and cannot contain digits.")

    if payload.username != current_user.username and User.objects(username=payload.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")

    current_user.username = payload.username
    if payload.full_name is not None:
        current_user.full_name = payload.full_name.strip()
    current_user.save()

    return {"message": "Profile updated successfully.", "user": current_user.to_dict()}


@auth_router.post('/change-password')
async def change_password(payload: ChangePasswordRequest, current_user: User = Depends(get_current_user)):
    if not current_user.check_password(payload.current_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    if len(payload.new_password) < 6 or not is_strong_password(payload.new_password):
        raise HTTPException(
            status_code=400,
            detail="New password must be at least 6 characters and contain at least one uppercase letter, one digit, and one special character."
        )

    current_user.set_password(payload.new_password)
    current_user.save()
    return {"message": "Password changed successfully."}


@auth_router.post('/verify-otp')
async def verify_otp(payload: VerifyOtpRequest):
    user = User.objects(email=payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    if user.email_verified:
        raise HTTPException(status_code=400, detail="Email already verified")
    if not user.otp_code or not user.otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP not issued. Please request a new code.")

    now = datetime.datetime.utcnow()
    if now > user.otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new code.")
    if payload.otp.strip() != user.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    user.email_verified = True
    user.otp_code = None
    user.otp_sent_at = None
    user.otp_expires_at = None
    user.save()

    token = jwt.encode({
        'user_id': str(user.id),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, Config.JWT_SECRET_KEY, algorithm="HS256")

    return {'token': token, 'user': user.to_dict()}


@auth_router.post('/login')
async def login(auth: UserLogin):
    user = User.objects(email=auth.email).first()

    if not user or not user.check_password(auth.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = jwt.encode({
        'user_id': str(user.id),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, Config.JWT_SECRET_KEY, algorithm="HS256")

    return {'token': token, 'user': user.to_dict()}