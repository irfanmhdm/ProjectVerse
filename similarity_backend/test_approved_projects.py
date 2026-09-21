from services.project_processor import (
    get_approved_projects
)


print("===== APPROVED PROJECTS =====")

projects = get_approved_projects()

print(
    "Approved projects found:",
    len(projects)
)

for project in projects:

    print("\n----------------------------")

    print(
        "Project ID:",
        project["id"]
    )

    print(
        "Title:",
        project["title"]
    )

    print(
        "Domain:",
        project["domain"]
    )

    print(
        "Technologies:",
        project["technologies"]
    )

    print(
        "Report:",
        project["reportName"]
    )

    print(
        "Report URL:",
        project["reportUrl"]
    )

print(
    "\n===== COMPLETE ====="
)