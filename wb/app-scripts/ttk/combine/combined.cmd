@echo off
setlocal enabledelayedexpansion

:: ����塞 ���� combined.js, �᫨ �� �������
if exist combined.js del combined.js

:: ������塞 䠩�� JS �� ��४�ਨ ..\app\
for %%f in (..\app\*.js) do (
    type "%%f" >> combined.js
    echo.>> combined.js
)

echo ���� combined.js �ᯥ譮 ᮧ���.