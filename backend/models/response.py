from flask import jsonify

def success_response(data, status=200):
    """
    Returns a consistent success response format.
    """
    return jsonify({
        'status': 'success',
        'data': data
    }), status

def error_response(message, status=400):
    """
    Returns a consistent error response format.
    """
    return jsonify({
        'status': 'error',
        'message': message
    }), status
