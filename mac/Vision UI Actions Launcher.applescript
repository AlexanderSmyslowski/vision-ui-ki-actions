-- Vision UI → Actions: Launcher App
-- Starts the local server in Terminal and opens the UI in the default browser.

on run
	set appSupportDir to POSIX path of (path to library folder from user domain) & "Application Support/Vision UI Actions"
	set repoDir to appSupportDir
	set startScript to repoDir & "/scripts/mac/start_server.sh"
	set portStr to "8787"
	set localUrl to "http://localhost:" & portStr

	-- Validate install
	try
		do shell script "test -d " & quoted form of repoDir
	on error
		display dialog "Repo not found. Please run scripts/mac/install_app.command once." buttons {"OK"} default button "OK"
		return
	end try

	tell application "Terminal"
		activate
		-- open a new window/tab and run the server
		do script "cd " & quoted form of repoDir & "; export PORT=" & portStr & "; " & quoted form of startScript
	end tell

	tell application "System Events"
		-- give server a moment to boot
		delay 1.0
	end tell

	-- Open in default browser (avoid Safari dependency)
	do shell script "open " & quoted form of localUrl
end run
