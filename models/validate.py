from pydantic import BaseModel, EmailStr, validator

class User(BaseModel):
    email: EmailStr
    password: str

    @validator('password')
    def validate_password(cls, value):
        if len(value.strip()) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        

        return value



# https://www.youtube.com/watch?v=5h63AfcVerM