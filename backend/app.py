from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.objectid import ObjectId # Needed to query by MongoDB's unique _id
from flask_cors import CORS # Import CORS

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# MongoDB connection details
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "todo_db"
COLLECTION_NAME = "todos" # Define the collection name for todo items

# Establish connection to MongoDB
client = None # Initialize client outside try block
db = None     # Initialize db outside try block
try:
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    # Ping the server to ensure connection
    client.admin.command('ping')
    print(f"Successfully connected to MongoDB: {DB_NAME}")
except Exception as e:
    print(f"Could not connect to MongoDB: {e}")
    # In a real application, you might want to log this and perhaps exit or degrade gracefully
    # For development, we'll let it run but API routes will fail if client is None

# Get the todos collection
todos_collection = db[COLLECTION_NAME] if db != None else None

# --- API Routes ---

# 1. Create a new Todo (POST)
@app.route('/todos', methods=['POST'])
def create_todo():
    if todos_collection == None:
        return jsonify({"error": "Database not connected"}), 500

    data = request.json
    if not data or 'title' not in data:
        return jsonify({"error": "Title is required"}), 400

    # Define the structure for a new todo item
    new_todo = {
        "title": data['title'],
        "description": data.get('description', ''), # Get description, default to empty string if not provided
        "completed": False, # New todos are not completed by default
        "created_at": datetime.now() # Add timestamp (requires import)
    }

    try:
        result = todos_collection.insert_one(new_todo)
        # MongoDB's _id is an ObjectId, convert to string for JSON response
        new_todo['_id'] = str(result.inserted_id)
        new_todo['created_at'] = new_todo['created_at'].isoformat() # Convert datetime to string for JSON
        return jsonify(new_todo), 201 # 201 Created status
    except Exception as e:
        return jsonify({"error": f"Failed to create todo: {e}"}), 500

# 2. Get all Todos (GET)
@app.route('/todos', methods=['GET'])
def get_todos():
    if todos_collection == None:
        return jsonify({"error": "Database not connected"}), 500

    try:
        todos = []
        for todo in todos_collection.find():
            # Convert ObjectId to string and datetime to ISO format for JSON serialization
            todo['_id'] = str(todo['_id'])
            if 'created_at' in todo and isinstance(todo['created_at'], datetime):
                todo['created_at'] = todo['created_at'].isoformat()
            todos.append(todo)
        return jsonify(todos), 200
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve todos: {e}"}), 500

# 3. Get a single Todo by ID (GET)
@app.route('/todos/<id>', methods=['GET'])
def get_todo(id):
    if todos_collection == None:
        return jsonify({"error": "Database not connected"}), 500

    try:
        # Ensure the ID is a valid ObjectId before querying
        todo = todos_collection.find_one({"_id": ObjectId(id)})
        if todo:
            todo['_id'] = str(todo['_id'])
            if 'created_at' in todo and isinstance(todo['created_at'], datetime):
                todo['created_at'] = todo['created_at'].isoformat()
            return jsonify(todo), 200
        else:
            return jsonify({"message": "Todo not found"}), 404
    except Exception as e:
        # This catch will handle invalid ObjectId formats too
        return jsonify({"error": f"Invalid ID or failed to retrieve todo: {e}"}), 400 # 400 Bad Request

# 4. Update a Todo by ID (PUT)
@app.route('/todos/<id>', methods=['PUT'])
def update_todo(id):
    if todos_collection == None:
        return jsonify({"error": "Database not connected"}), 500

    data = request.json
    if not data:
        return jsonify({"error": "No data provided for update"}), 400

    # Prepare update data (only allow specific fields to be updated)
    update_fields = {}
    if 'title' in data:
        update_fields['title'] = data['title']
    if 'description' in data:
        update_fields['description'] = data['description']
    if 'completed' in data:
        update_fields['completed'] = bool(data['completed']) # Ensure boolean type

    if not update_fields:
        return jsonify({"error": "No valid fields to update"}), 400

    try:
        result = todos_collection.update_one(
            {"_id": ObjectId(id)},
            {"$set": update_fields}
        )
        if result.matched_count == 0:
            return jsonify({"message": "Todo not found"}), 404
        if result.modified_count == 0:
            return jsonify({"message": "No changes made to the todo"}), 200 # Still success, but no mod

        # Fetch the updated todo to return it
        updated_todo = todos_collection.find_one({"_id": ObjectId(id)})
        if updated_todo:
            updated_todo['_id'] = str(updated_todo['_id'])
            if 'created_at' in updated_todo and isinstance(updated_todo['created_at'], datetime):
                updated_todo['created_at'] = updated_todo['created_at'].isoformat()
            return jsonify(updated_todo), 200
        else:
            # This case should ideally not happen if matched_count > 0
            return jsonify({"message": "Todo updated but could not be fetched"}), 500

    except Exception as e:
        return jsonify({"error": f"Invalid ID or failed to update todo: {e}"}), 400

# 5. Delete a Todo by ID (DELETE)
@app.route('/todos/<id>', methods=['DELETE'])
def delete_todo(id):
    if todos_collection == None:
        return jsonify({"error": "Database not connected"}), 500

    try:
        result = todos_collection.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            return jsonify({"message": "Todo not found"}), 404
        return jsonify({"message": "Todo deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"Invalid ID or failed to delete todo: {e}"}), 400


if __name__ == '__main__':
    # Make sure to import datetime at the top of your file
    from datetime import datetime
    app.run(debug=True, port=5000) # Ensure it runs on port 5000