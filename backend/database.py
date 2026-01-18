from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import certifi

load_dotenv()

# MongoDB connection
MONGODB_CONNECTION_STRING = os.getenv(
    "MONGODB_CONNECTION_STRING",
    "mongodb+srv://owenchend_db_user:kU2F1onGsj12M0LH@cluster0.ec2quxk.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority",
)
MONGODB_DATABASE_NAME = os.getenv("MONGODB_DATABASE_NAME", "Lifeline")

client: AsyncIOMotorClient | None = None


async def init_db():
    """Initialize MongoDB connection and Beanie."""
    global client

    try:
        # Increase timeouts for slow networks
        client = AsyncIOMotorClient(
            MONGODB_CONNECTION_STRING,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=30000,  # 30 seconds
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
        )

        # Test connection first
        await client.admin.command("ping")

        from models import Camera, Event, Ambulance, Hospital

        await init_beanie(
            database=client[MONGODB_DATABASE_NAME],
            document_models=[Camera, Event, Ambulance, Hospital],
        )

        print(f"✅ Connected to MongoDB: {MONGODB_DATABASE_NAME}")
    except Exception as e:
        error_msg = str(e)
        print(f"❌ MongoDB connection failed: {error_msg}")

        # Provide helpful troubleshooting
        if "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
            print("\n🔍 Troubleshooting:")
            print("1. Check if MongoDB Atlas cluster is running (not paused)")
            print(
                "2. Verify your IP is whitelisted in Network Access (or use 0.0.0.0/0 for dev)"
            )
            print("3. Check your internet connection")
            print("4. Verify the connection string is correct")
            print("\n💡 The app will continue but database operations will fail.")
            print("   Fix the connection and restart the server.")

        # Don't raise - allow app to start (routes will fail gracefully)
        # raise  # Uncomment to make MongoDB required
