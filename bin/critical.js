#! /usr/bin/env node
var fs = require( "fs" );
var criticalcss = require( "../critical" );

var argv = require( "yargs" )
           .usage( "Usage: $0 <command> [options]" )
           .command( "run", "Run criticalcss" )

           .alias( "u", "url" )
           .demand( "url" )
           .string( "url" )
           .describe( "url", "The url you would like to run criticalcss against" )

           .alias( "f", "file" )
           .demand( "file" )
           .string( "file" )
           .describe( "file", "The local css file you're referencing for criticalcss" )

           .alias( "w", "width" )
           .describe( "width", "The width of your viewport" )
           .default( "width", 1200 )

           .alias( "h", "height" )
           .describe( "height", "The height of your viewport" )
           .default( "height", 900 )

           .alias( "o", "output" )
           .describe( "output", "The name of your output css file" )
           .string( "output" )
           .default( "output", "dist/dist.css" )

           .alias( "b", "buffer" )
           .describe( "buffer", "Specifies the largest amount of data allowed on stdout or stderr - if this value is exceeded then the child process is killed" )
           .default( "buffer", 800*1024 )

           .alias( "force", "forceInclude" )
           .describe( "forceInclude", "Sometimes selectors need to be forced into the criticalcss" )
           .array( "forceInclude" )
           .default( "forceInclude", [] )

           .alias( "i", "ignoreConsole" )
           .boolean( "ignoreConsole" )
           .describe( "ignoreConsole", "Criticalcss will pick up console errors, set this to ignore them" )
           .default( "ignoreConsole", false )

           .count( "verbose" )
           .alias( "v", "verbose" )

           .help( "help" )
           .argv;

var VERBOSE_LEVEL = argv.verbose;

var WARN = function(){
  VERBOSE_LEVEL >= 0 && console.log.apply(console, arguments);
};
var INFO = function(){
  VERBOSE_LEVEL >= 1 && console.log.apply(console, arguments);
};
var DEBUG = function() {
  VERBOSE_LEVEL >= 2 && console.log.apply(console, arguments);
};

var options = {
  width: argv.width,
  height: argv.height,
  outputfile: argv.output,
  forceInclude: argv.forceInclude,
  buffer: argv.buffer,
  ignoreConsole: argv.ignoreConsole,
};



criticalcss.getRules( argv.file, { buffer: options.buffer }, function( err, content ){
  if( err ){
    throw new Error( err.message );
  }

  options.rules = JSON.parse( content );

  criticalcss.findCritical( argv.url, options, function(err, content){
    if( err ){
      throw new Error( err.message );
    }
	  
	// START MAGENTO-ADJUSTMENT
    // If outputfile is phtml it means our local paths won't work when rendered as non-CSS
    if(options.outputfile.endsWith('phtml')){
        // Replace relative paths with magento skin URLs
        var search = /url\((..\/)+/g;
		var searchApostrophe = /url\(\'?(..\/)+/g;
		var searchQuote = /url\(\"?(..\/)+/g;
		var replacement = "url(<?php echo $this->getSkinUrl('', array('_secure'=>true)); ?>";
		var replacementApostrophe = "url('<?php echo $this->getSkinUrl('', array('_secure'=>true)); ?>";
		var replacementQuote = "url(\"<?php echo $this->getSkinUrl('', array('_secure'=>true)); ?>";
		content = content.replace(search, replacement);
		content = content.replace(searchApostrophe, replacementApostrophe);
		content = content.replace(searchQuote, replacementQuote);
    }
    // END MAGENTO-ADJUSTMENT
	  
    fs.writeFileSync( options.outputfile, content );
    // Print a success message.
    INFO("File " + options.outputfile + " created.");
  });

});

