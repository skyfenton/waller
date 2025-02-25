def lambda_handler(event, context):
    print("Hello, Lambda!")
    print(event)
    print(context)
    # print(event['headers']['content-type'])
    # print(event['body'][:128]+f"... ({len(event['body'])})")
    # return {"statusCode": 200, "body": "Lambda is working!"}
