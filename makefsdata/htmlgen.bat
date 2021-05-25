rmdir "%~dp0..\release" /S /q
rmdir "%~dp0..\project" /S /q
mkdir "%~dp0..\release"
mkdir "%~dp0..\project"
xcopy "%~dp0..\public\index.html" "%~dp0..\release\index.html"* /y /i
xcopy "%~dp0..\public\bundle.js" "%~dp0..\release\bundle.js"* /y /i
xcopy "%~dp0..\public\favicon.ico" "%~dp0..\release\favicon.ico"* /y /i
xcopy "%~dp0..\public\css" "%~dp0..\release\css" /s /e /y /i
htmlgen.exe "%~dp0..\release" -e -11
xcopy "%~dp0..\project\fsdata.c" "%~dp0..\release\fsdata.c"* /y /i
rmdir "%~dp0../project" /S /q
pause