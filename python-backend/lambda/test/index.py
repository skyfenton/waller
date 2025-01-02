def lambda_handler(event, context):
    print("Hello, Lambda!")
    print(event)
    print(context)
    return {
        'statusCode': 200,
        'body': 'Lambda is working!'
    }