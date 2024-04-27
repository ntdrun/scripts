@echo off
setlocal enabledelayedexpansion

:: Установка пути к директории с проектами относительно места расположения этого скрипта
set "PROJECTS_DIR=.\"

:: Переход в каждую папку и выполнение npx clasp pull
for /d %%d in ("%PROJECTS_DIR%\*") do (
    pushd %%d
    if exist package.json (
        echo Processing folder: %%d
        npx clasp pull
    ) else (
        echo Skipped: %%d does not contain package.json
    )
    popd
)

echo All done!
pause
