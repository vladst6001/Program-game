from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    name: str
    phone: str | None = None
    email: EmailStr | None = None
    password: str


class LoginRequest(BaseModel):
    phone: str
    password: str


class SendCodeRequest(BaseModel):
    phone: str


class VerifyCodeRequest(BaseModel):
    phone: str
    code: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
