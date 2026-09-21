from services.project_processor import (
    get_approved_projects,
    download_project_report
)


print("===== REPORT DOWNLOAD TEST =====")


projects = get_approved_projects()

print(
    "Approved projects:",
    len(projects)
)


for project in projects:

    print(
        "\nDownloading:",
        project["title"]
    )

    report_path = download_project_report(
        project["reportUrl"],
        project["id"]
    )

    print(
        "Downloaded to:",
        report_path
    )


print(
    "\n===== DOWNLOAD COMPLETE ====="
)