from services.firebase_service import db


print("===== FIREBASE CONNECTION TEST =====")

projects = db.collection("projects").limit(5).stream()

count = 0

for project in projects:

    data = project.to_dict()

    print("\nProject ID:", project.id)
    print("Title:", data.get("title"))
    print("Status:", data.get("status"))

    count += 1


print("\nProjects found:", count)
print("===== FIREBASE CONNECTION SUCCESS =====")