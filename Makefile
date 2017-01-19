all:

run:
	# Run with Marionette enabled so that we can instrument the browser
	# from test cases.
	/Applications/FirefoxDeveloperEdition.app/Contents/MacOS/firefox -marionette
