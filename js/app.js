
  (function() {


    /*
     * Vizzuality Timeline View
     */
    var VizzualityView = Backbone.View.extend({

      defaults: {
        table: "vizzuality_timeline",
        loaderOptions: {
          lines: 14,length: 0,width: 4,radius: 10,rotate: 0,color: '#999',
          speed: 1,trail: 89,shadow: false,hwaccel: true,className: 'spinner',
          zIndex: 2e9,top: 'auto',left: 'auto'
        }
      },

      events: {
        "click div.years a": "_onYearsMenuClick"
      },

      initialize: function() {

        // Bind this to all
        _.bindAll(this, "_drawAppointment", "_onYearsMenuClick");

        // Extend options with defaults
        _.defaults(this.options, this.defaults);

        // Init loader
        this._initLoader();

        // Bind model change
        this.model
          .bind("change", this.render, this)
          .fetch({
            data: { q: "SELECT * FROM " + this.options.table + " ORDER BY date_trunc('day',\"when\") DESC" }
          });
      },

      render: function() {

        // Timeline symlink
        this.$timeline = this.$el.find("div.layout");

        // Footer symlink
        this.$footer = this.$el.find("footer");

        // Copy the model
        var history = this.model.get("rows")
          , self = this;

        // Set the options
        this.timeline = {
          side: "left",
          last_month: "",
          last_year: ""
        };

        // Start drawing!
        drawRow()

        function drawRow() {

          var day = history.shift();

          self._drawAppointment(day);
          
          if (history.length > 0) {
            setTimeout(drawRow,2);
          } else {
            self._stopLoader();
            self._bindSpecialEvents();
            return self;
          }
        }

      },

      _drawAppointment: function(day,last_month,last_year) {

        var timestamp = new Date() - new Date(day.when)
          , timeline = this.timeline
          , $month_block = this.$timeline.find("div.month").last();

        // Check if it belongs to a new month or not
        if (timeline.last_month != new Date(day.when).getMonthName()) {
          // Set new month
          this.timeline.last_month = new Date(day.when).getMonthName();

          // Create a new month
          $month_block = $(this.make("div", {"class": "month"}, "<div class='left'></div><div class='right'></div>"));
          var month_span = this.make("span", {"class": "month"}, timeline.last_month);

          $month_block.append(month_span)

          // Add the month block
          this.$timeline.append($month_block);

          // Set month correctly centered
          var month_span_width = $(month_span).outerWidth();

          $(month_span).css({"margin-left": "-" + (month_span_width/2) + "px"})
        }


        // Check if it belongs to a new year or not
        if (timeline.last_year != new Date(day.when).getFullYear()) {
          // Set new year
          this.timeline.last_year = new Date(day.when).getFullYear();

          // Create the new year
          var year_span = this.make("span", {"class": "year", "id": ( "year" + timeline.last_year )}, timeline.last_year);

          // Append it
          $month_block.append(year_span);

          // Set year correctly centered
          var year_span_width = $(year_span).outerWidth();

          $(year_span).css({"margin-left": "-" + (year_span_width/2) + "px"});

          // New year for the footer years menu
          var year = this.make("a", {"id":timeline.last_year, "href": "#go" + timeline.last_year}, timeline.last_year);
          this.$footer.find("div.years").append(year);
        }


        // Block
        var $appointment = $(this.make("div", {"class": "appointment"}, ""));

        $month_block.find("." + timeline.side).append($appointment);

        if (day.link)         var a_link = "<a href='" + day.link + "' target='_blank'>" + day.title + "</a>";
        if (day.title)        $appointment.append("<h3>" +  ((a_link) ? a_link : day.title) + "</h3>");
        if (day.description)  $appointment.append("<p class='description'>" + day.description + "</p>");
        if (day.image)        $appointment.append("<img height='" + day.asset_height + "' src='/img/layout/" + day.image + "' title='" + day.title + "' alt='" + day.title + "' />");
        if (day.position)     $appointment.append("<div class='map' id='map" + day.cartodb_id + "'></div>");
        if (day.footer)       $appointment.append("<p class='footer'>" + day.footer + "</p>");


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


        // Point of the day
        var date_no_proccessed = new Date(day.when).toLocaleDateString()
          , parts = date_no_proccessed.split(",");
        parts.shift();
        $appointment.append("<span class='day' title='" + parts + "'></span>")


        // Type of the appointment
        var type = $("<span>").addClass("type " + day.status + " " + day.type);
        $appointment.append(type);

        // Change side for the next
        if ($month_block.find(".left").height() > $month_block.find(".right").height()) {
          this.timeline.side = "right";
        } else if ($month_block.find(".left").height() < $month_block.find(".right").height()) {
          this.timeline.side = "left";
        }

      },

      _initLoader: function() {
        // Loader symlink
        this.$loader = this.$el.find("div.loader");

        // Header symlink
        this.$header = this.$el.find("header");

        // Start spinner
        var target = this.$loader.find("#spin")[0]
          , spinner = new Spinner(this.options.loaderOptions).spin(target);
      },

      _stopLoader: function() {
        var self = this;
        this.$loader.animate({
          marginTop:"30px",
          opacity:0
        }, 500, function(){
          self.$header.show();
          self.$footer.show();
          self.$timeline.css({ opacity:1 });
          $(this).remove();
        });
      },

      _onYearsMenuClick: function(ev) {
        ev.preventDefault();

        var year = $(ev.target).text()
          , top = this.$el.find("span#year" + year).offset().top
          , self = this;

        $("html,body").stop(true).animate({
          scrollTop: (top - 20) + "px"
        }, 750, function() {
          self.$footer.find("div.years > a.selected").removeClass("selected");
          self.$footer.find("div.years > a:contains('" + year + "')").addClass("selected");
        })
      },

      _bindSpecialEvents: function() {
        // Init tipsy
        this.$el.find("span.day").tipsy({gravity: 's', offset: '5'});

        // Init waypoint
        var self = this;
        this.$el.find("span.year").waypoint(function(ev,direction){
          var year = $(this).text();
          self.$footer.find("div.years > a.selected").removeClass("selected");
          self.$footer.find("div.years > a:contains('" + year + "')").addClass("selected");
        }, {offset:"50%"});
      }
    })

    /*
     * Vizzuality Timeline Model
     */
    var VizzualityModel = Backbone.Model.extend({
      urlRoot: "http://xavijam.cartodb.com/api/v2/sql"
    });



   
    window.vizzualityTimeline = new VizzualityView({
      el: $("body"),
      model: new VizzualityModel()
    });
  })()