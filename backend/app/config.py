from pydantic import Field, HttpUrl, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: HttpUrl
    supabase_publishable_key: SecretStr
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    @field_validator("supabase_publishable_key")
    @classmethod
    def public_key_only(cls, value: SecretStr) -> SecretStr:
        if not value.get_secret_value().startswith("sb_publishable_"):
            raise ValueError("Use a Supabase publishable key, never a secret or service-role key")
        return value

    @field_validator("cors_origins")
    @classmethod
    def explicit_origins(cls, value: list[str]) -> list[str]:
        if "*" in value:
            raise ValueError("Use explicit CORS origins")
        return value
