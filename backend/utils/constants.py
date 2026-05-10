SUPPORTED_DOMAINS = [
    "Software Engineering",
    "Frontend Development",
    "Backend Development",
    "Full Stack Development",
    "Mobile App Development",
    "Data Science & AI",
    "ML Engineer",
    "Data Engineering",
    "Cyber Security",
    "Cloud Architecture",
    "DevOps & SRE",
    "UI/UX Design",
    "Product Management (Tech)",
    "QA & Test Automation",
    "Network Engineering",
    "Database Administration",
    "Blockchain Development",
    "Embedded Systems & IoT",
    "Game Development",
    "IT Project Management",
    "System Administration",
    "AR/VR Development",
    "Salesforce Development",
    "Big Data Analytics",
    "IT Infrastructure",
    "General"
]

DIFFICULTY_LEVELS = ["easy", "medium", "hard"]

INTERVIEW_MODES = ["hr", "technical", "mixed", "full"]

ANSWER_MODES = ["text", "audio", "video"]

AGENT_WEIGHTS = {
    "hr": 0.30,
    "technical": 0.40,
    "stress": 0.15,
    "company": 0.15
}

COMPANY_REGISTRY = {
    "Google": {
        "domains": ["Software Engineering", "ML Engineer", "Cloud Architecture", "Data Science & AI"],
        "roles": ["Software Engineer", "ML Engineer", "Cloud Engineer", "SRE", "Data Scientist"]
    },
    "Meta": {
        "domains": ["Software Engineering", "Frontend Development", "Data Science & AI", "AR/VR Development"],
        "roles": ["Software Engineer", "Frontend Engineer", "Data Scientist", "Research Scientist", "Product Designer"]
    },
    "Apple": {
        "domains": ["Software Engineering", "Mobile App Development", "Embedded Systems & IoT", "ML Engineer"],
        "roles": ["Software Engineer", "iOS Developer", "ML Engineer", "Hardware Engineer", "Design Technologist"]
    },
    "Amazon": {
        "domains": ["Software Engineering", "Cloud Architecture", "DevOps & SRE", "Data Engineering"],
        "roles": ["SDE I", "SDE II", "Solutions Architect", "Data Engineer", "DevOps Engineer"]
    },
    "Microsoft": {
        "domains": ["Software Engineering", "Cloud Architecture", "Full Stack Development", "Data Science & AI"],
        "roles": ["Software Engineer", "Cloud Solutions Architect", "Full Stack Developer", "Data Scientist", "PM"]
    },
    "Netflix": {
        "domains": ["Software Engineering", "Backend Development", "Data Engineering", "ML Engineer"],
        "roles": ["Senior Software Engineer", "Backend Engineer", "Data Engineer", "ML Engineer"]
    },
    "Stripe": {
        "domains": ["Software Engineering", "Backend Development", "Full Stack Development", "Cyber Security"],
        "roles": ["Software Engineer", "Backend Engineer", "Full Stack Engineer", "Security Engineer"]
    },
    "Airbnb": {
        "domains": ["Software Engineering", "Frontend Development", "Full Stack Development", "Data Science & AI"],
        "roles": ["Software Engineer", "Frontend Engineer", "Full Stack Engineer", "Data Scientist"]
    },
    "Uber": {
        "domains": ["Software Engineering", "Backend Development", "ML Engineer", "Data Engineering"],
        "roles": ["Software Engineer", "Backend Engineer", "ML Engineer", "Data Engineer", "Staff Engineer"]
    },
    "Spotify": {
        "domains": ["Software Engineering", "Backend Development", "ML Engineer", "Data Engineering"],
        "roles": ["Software Engineer", "Backend Engineer", "ML Engineer", "Data Engineer"]
    },
    "Tesla": {
        "domains": ["Software Engineering", "Embedded Systems & IoT", "ML Engineer", "Data Science & AI"],
        "roles": ["Software Engineer", "Embedded Engineer", "ML Engineer", "Autopilot Engineer"]
    },
    "Adobe": {
        "domains": ["Software Engineering", "Frontend Development", "UI/UX Design", "Full Stack Development"],
        "roles": ["Software Engineer", "Frontend Engineer", "UI Engineer", "Full Stack Developer", "MTS"]
    },
    "Salesforce": {
        "domains": ["Software Engineering", "Cloud Architecture", "Salesforce Development", "Full Stack Development"],
        "roles": ["Software Engineer", "Salesforce Developer", "Cloud Engineer", "MTS", "AMTS"]
    },
    "Oracle": {
        "domains": ["Software Engineering", "Database Administration", "Cloud Architecture", "Backend Development"],
        "roles": ["Software Engineer", "Database Engineer", "Cloud Engineer", "Java Developer"]
    },
    "IBM": {
        "domains": ["Software Engineering", "Cloud Architecture", "Data Science & AI", "Cyber Security"],
        "roles": ["Software Engineer", "Cloud Developer", "Data Scientist", "Security Analyst"]
    },
    "Intel": {
        "domains": ["Software Engineering", "Embedded Systems & IoT", "ML Engineer", "QA & Test Automation"],
        "roles": ["Software Engineer", "Firmware Engineer", "Validation Engineer", "ML Engineer"]
    },
    "Nvidia": {
        "domains": ["Software Engineering", "ML Engineer", "Game Development", "Embedded Systems & IoT"],
        "roles": ["Software Engineer", "GPU Architect", "ML Engineer", "CUDA Developer", "Deep Learning Engineer"]
    },
    "LinkedIn": {
        "domains": ["Software Engineering", "Backend Development", "Data Science & AI", "Full Stack Development"],
        "roles": ["Software Engineer", "Backend Engineer", "Data Scientist", "Staff Engineer"]
    },
    "Shopify": {
        "domains": ["Software Engineering", "Full Stack Development", "Frontend Development", "Backend Development"],
        "roles": ["Software Engineer", "Full Stack Developer", "Frontend Engineer", "Backend Developer"]
    },
    "Twitter/X": {
        "domains": ["Software Engineering", "Backend Development", "ML Engineer", "Data Engineering"],
        "roles": ["Software Engineer", "Backend Engineer", "ML Engineer", "Data Engineer"]
    }
}
