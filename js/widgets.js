/***************************************************************************
 * VIZZUALITY TIMELINE
 **************************************************************************/

// Ensure private scope + aliases
(function ( $, window, undefined ) {

  var TRUE = true, FALSE = true, NULL = null,
  name = 'vizzTimeline',
  Core, API, Helper,
  defaultOptions = {
    globalEvents : []
  };

  /***************************************************************************
  * Private methods
  **************************************************************************/
  Core = {
    pluginName : name,
    options : null,
    eventHandlers: {},


    _init : function ( options ) {

      return this.each( function (i,el) {  
        var $el = $(this);

        Core.options = $.extend( true, defaultOptions, options );

        // Start loader
        Core._startLoader($el);

        // Get data
        Core._getData($el);
      });
    },


    _bind: function($el) {
      
    },


    _trigger : function ( eventName, data, $el ) {
      var isGlobal = $.inArray( eventName, Core.options.globalEvents ) >= 0, eventName = eventName + '.' +  Core.pluginName;

      if ( !isGlobal ) {
        $el.trigger( eventName, data );
      } else {
        $.event.trigger( eventName, data );
      }
    },


    _startLoader: function($el) {
      var opts = {
        lines: 14,length: 0,width: 4,radius: 10,rotate: 0,color: '#999',
        speed: 1,trail: 89,shadow: false,hwaccel: true,className: 'spinner',
        zIndex: 2e9,top: 'auto',left: 'auto'
      };
      var target = document.getElementById('spin')
        , spinner = new Spinner(opts).spin(target);
    },


    _stopLoader: function() {
      $("div.loader").animate({
        marginTop:"30px",
        opacity:0
      }, 500, function(){
        $("header").show();
        $(this).remove();
      });
    }, 


    _getData: function($el) {
      $.ajax({
        type: 'GET',
        dataType: 'jsonp',
        url: "http://xavijam.cartodb.com/api/v2/sql?q=SELECT * FROM vizzuality_timeline ORDER BY date_trunc('day',\"when\") DESC",
        success: function(r) {
          setTimeout(function(){
            Core._stopLoader();
            Core._drawTimeline($el, r.rows);
          },1000);
          
        },
        error: function() {
          console.log('Ooops! :S');
        }
      });
    },


    _drawTimeline: function($el,data) {

      var today = new Date()
        , timestamp = today - new Date(data[data.length-1].when)
        , months = ((timestamp / (1000*60*60*24*30)) * 100) + 400;

      var side = "left"
        , last_month = ""
        , last_year = ""
        , height = 0;



      function drawAppointment() {
        
        var day = data[0]
          , timestamp = today - new Date(day.when)
          , top_pos = (timestamp / (1000*60*60*24*30)) * 100;


        if (last_month != new Date(day.when).getMonthName()) {
          last_month = new Date(day.when).getMonthName();
          $el.append("<div class='month' style='margin:120px 0 0 0'><span class='month'>" + last_month + "</span><div class='left'></div><div class='right'></div></div>");

          // Set month correctly
          var width = $el.find("div.month:last-child span.month").outerWidth();
          $el.find("div.month:last-child span.month").css({"margin-left": "-" + (width/2) + "px"})

          // Set year correctly
          if (last_year != new Date(day.when).getFullYear()) {
            last_year = new Date(day.when).getFullYear();
            $el.find("div.month:last-child").append("<span class='year' id='year" + last_year + "'>" + last_year + "</span>")
            var width = $el.find("div.month:last-child span.year").outerWidth();
            $el.find("div.month:last-child span.year").css({"margin-left": "-" + (width/2) + "px"})

            $("footer > div.years").append("<a id='" + last_year + "button' href='#go" + last_year + "'>" + last_year + "</>");
          }

          side = "left";
        }

        // Block
        var appointment = $("<div>").addClass("appointment");
        $el.find("div.month:last-child ." + side).append(appointment);

        if (day.title)        appointment.append("<h3><a target='_blank' href='" + day.link + "'>" + day.title + "</a></h3>")
        if (day.description)  appointment.append("<p class='description'>" + day.description + "</p>")
        if (day.image)        appointment.append("<img src='/img/layout/" + day.image + "' title='" + day.title + "' alt='" + day.title + "' />")
        if (day.position)     appointment.append("<div class='map' id='map" + day.cartodb_id + "'></div>")
        if (day.footer)       appointment.append("<p class='footer'>" + day.footer + "</p>")

        // Map if exists
        if (day.position) {

          var map = new L.Map('map' + day.cartodb_id)
            , position = day.position.split(',')
            , center = new L.LatLng(position[0],position[1]);

          // create a CloudMade tile layer with style #997 (or use other provider of your choice)
          var cloudmade = new L.TileLayer('http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png', {
              attribution: '',
              maxZoom: 20
          });

          // add the layer to the map, set the view to a given place and zoom
          map.addLayer(cloudmade).setView(center, 16);

          // create a marker in the given location and add it to the map
          var marker = new L.Marker(center);
          map.addLayer(marker);
        }


        // Point
        var date_no_proccessed = new Date(day.when).toLocaleDateString()
          , parts = date_no_proccessed.split(",");
        parts.shift();
        appointment
          .append("<span class='day' title='" + parts + "'></span>")


        // Type
        var type = $("<span>").addClass("type " + day.status + " " + day.type);
        appointment.append(type);

        // Change side for the next
        if ($el.find("div.month:last-child .left").height() > $el.find("div.month:last-child .right").height()) {
          side = "right";
        } else {
          side = "left"
        }

        // Remove last
        data.shift();

        // More?
        if (data.length > 0)
          setTimeout(drawAppointment,1);
      }


      drawAppointment();


      // Show timeline and footer
      $("footer,.timeline").show();

      // Init tipsy?
      $el.find("span.day").tipsy({gravity: 's', offset: '5'})


      $("span.year").waypoint(function(event,direction){
        var year = $(this).text();
        $("footer > div.years > a.selected").removeClass("selected");
        $("footer > div.years > a:contains('" + year + "')").addClass("selected");
      }, {offset:"50%"});

      $("div.years a").click(function(ev){
        ev.preventDefault();
        var year = $(this).text()
          , top = $("span#year" + year).offset().top;

        $("html,body").stop(true).animate({
          scrollTop: (top - 20) + "px"
        }, 750, function() {
          $("footer > div.years > a.selected").removeClass("selected");
          $("footer > div.years > a:contains('" + year + "')").addClass("selected");
        })
      });

    }
  };

  /***************************************************************************
  * Public methods
  **************************************************************************/
  API = {};


  /***************************************************************************
   * Helpers (general purpose private methods)
  **************************************************************************/
  Helper = {};


  /***************************************************************************
   * Plugin installation
  **************************************************************************/
   $.fn[ name ] = function ( userInput ) {
     // check if such method exists
     if ( $.type( userInput ) === "string" && API[ userInput ] ) {
       return API[ userInput ].apply( this, Array.prototype.slice.call( arguments, 1 ) );
     }
     /* initialise otherwise */
     else if ( $.type( userInput ) === "object" || !userInput ) {
       return Core._init.apply( this, arguments );
     } else {
       $.error( 'You cannot invoke ' + name + ' jQuery plugin with the arguments: ' + userInput );
     }
   };
  })( jQuery, window );

  // Let's start the party
  $(document).ready(
    function() {
      $("div.layout").vizzTimeline()
    }
  )

  Date.prototype.monthNames = [
    "January", "February", "March",
    "April", "May", "June",
    "July", "August", "September",
    "October", "November", "December"
  ];
  Date.prototype.getMonthName = function() {
    return this.monthNames[this.getMonth()];
  };
  Date.prototype.getShortMonthName = function () {
    return this.getMonthName().substr(0, 3);
  };