import asyncio
import sys

from redis.asyncio import Redis

async def main():
    redis_client = Redis.from_url('redis://localhost', decode_responses=True)
    try:
        # Check type of what eval returns
        result = redis_client.eval("return 'hello'", 0)
        print("eval returned:", type(result))
        
        # Check type of what get returns
        result_get = redis_client.get("test")
        print("get returned:", type(result_get))
        
        # Check type of what getdel returns
        result_getdel = redis_client.getdel("test")
        print("getdel returned:", type(result_getdel))
        
    except Exception as e:
        print("Error:", e)
    finally:
        await redis_client.close()

if __name__ == "__main__":
    asyncio.run(main())
