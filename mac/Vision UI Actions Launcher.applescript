-- Vision UI → Actions: Launcher App
-- Starts the local server in Terminal and opens the UI in the default browser.

on run
	set appBundle to POSIX path of (path to me)
	set repoDir to do shell script "cd " & quoted form of (appBundle & "/../..") & "; pwd"
	set startScript to repoDir & "/scripts/mac/start_server.sh"
	set portStr to "8787"
	set localUrl to "http://localhost:" & portStr

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
