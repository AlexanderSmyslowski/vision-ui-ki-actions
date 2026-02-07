-- Vision UI → Actions: Launcher App
-- Starts the local server in Terminal and opens the UI in the default browser.

on run
	set repoDir to "/Users/hans_clawbot/.openclaw/workspace/vision-ui-ki-actions"	
	set startScript to repoDir & "/scripts/mac/start_server.sh"
	set port to "8787"
	set localUrl to "http://localhost:" & port

	tell application "Terminal"
		activate
		-- open a new window/tab and run the server
		do script "cd " & quoted form of repoDir & "; export PORT=" & port & "; " & quoted form of startScript
	end tell

	tell application "System Events"
		-- give server a moment to boot
		delay 1.0
	end tell

	tell application "Safari"
		activate
		open location localUrl
	end tell
end run
