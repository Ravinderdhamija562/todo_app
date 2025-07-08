# todo_app

## Setup

### Phase1 - Backend setup

Task 1. Set up env

- Create git repo, clone it locally(todo_app)

```sh
cd todo_app
mkdir -p backend
mkdir -p frontend
conda create -n todo_app_env python=3.12
conda activate todo_app_env
```

Task 2. Install python dependencies

```sh
pip install flask
pip install Flask-Cors
```

Task 3. MongoDB connection setup

```sh
colima start --vm-type=vz --dns 1.1.1.1
docker run --name todo-mongo -p 27017:27017 -d mongo:6.0
docker ps
```

```sh
pip install pymongo
```

- Create backend/app.py for python app
- Run python flask app

```sh
cd backend
python app.py
```

Task 4. Mongodb db schema

```json
{
    "_id": "ObjectId('60d5ec49f1d4f2b1c4e9f5e1')",
    "title": "Learn Flask and MongoDB",
    "description": "Complete all backend tasks for the web app project.",
    "completed": false,
    "created_at": "2025-07-08T10:00:00Z"
}
```

Task 5. Run Flask app and test it

```sh
python app.py
curl -X POST -H "Content-Type: application/json" -d '{"title": "Buy groceries", "description": "Milk, eggs, bread"}' http://127.0.0.1:5000/todos
# Returned todo id - 686cf16d419a9e5389c133fc
curl -X PUT -H "Content-Type: application/json" -d '{"completed": true}' http://127.0.0.1:5000/todos/686cf16d419a9e5389c133fc
curl -X DELETE http://127.0.0.1:5000/todos/686cf16d419a9e5389c133fc
```

## Phase 2 - Frontend app

- Add index.html, scriptjs, style.css in frontend folder
- Open index.html in the local web browser
- Test various buttons in the page


## Techstack

App with HTML,CSS,JS,Python,Mongo
