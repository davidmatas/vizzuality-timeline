
  $(document).ready(function() {

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

        // Bind this to these functions
        _.bindAll(this, "_drawAppointment", "_onYearsMenuClick");

        // Extend options with defaults
        _.defaults(this.options, this.defaults);

        // Init loader
        this._initLoader();

        // Bind model change
        this.model
          .bind("change", this.render, this)
          .fetch({
            data: { q: "SELECT * FROM " + this.options.table + " ORDER BY date_trunc('day',\"when\") DESC" },
            dataType: "jsonp"
          });
      },

      render: function() {

        // Timeline symlink
        this.$timeline = this.$el.find("div.layout");

        // Footer symlink
        this.$footer = this.$el.find("footer");

        // Copy the model
        var history = this.model.clone().get("rows")
          , self = this
          , model_size = _.size(this.model.get("rows"));

        // Set the options
        this.timeline = {
          side: "left",
          last_month: "",
          last_year: ""
        };

        // Initialize the stats 
        this.stats = {
          projects: 0,
          employees: 0,
          offices: 0,
          years: 0
        }

        // Start drawing!
        drawRow();

        function drawRow() {
          var day = history.shift();

          self._drawAppointment(day);
          
          if (history.length > 0) {
            self._updateLoader(_.size(history),model_size);

            setTimeout(drawRow,10);
          } else {
            self._printStats();
            self._showBorn();
            self._bindSpecialEvents();            
            self._stopLoader();
            return self;
          }
        }

      },

      _drawAppointment: function(day,last_month,last_year) {

        var timestamp = new Date() - new Date(day.when)
          , timeline = this.timeline
          , $month_block = this.$timeline.find("div.month").last()
          , first = false;

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

          // First appointment
          first = true;
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


        /* Taking stats */
        // Project? Add it
        if (day.type == "project") this.stats.projects++;
        // Active employee? Add it
        if (day.type == "recruitment" && day.status) this.stats.employees++;
        // Active office? Add it
        if (day.type == "office" && day.status) this.stats.offices++;


        // Block
        var $appointment = $(this.make("div", {"class": "appointment " + day.status + " " + (first ? "first" : "")}, ""));

        $month_block.find("." + timeline.side).append($appointment);

        if (day.link)         var a_link = "<a href='" + day.link + "' target='_blank'>" + day.title + "</a>";
        if (day.title)        $appointment.append("<h3>" +  ((a_link) ? a_link : day.title) + "</h3>");
        if (day.description)  $appointment.append("<p class='description'>" + day.description + "</p>");
        if (day.video)        $appointment.append(day.video);
        if (day.image)        $appointment.append("<div class='image'><img height='" + (day.asset_height || 165) + "' src='/img/layout/" + day.image + "' title='" + day.title + "' alt='" + day.title + "' /></div>");
        if (day.position)     $appointment.append("<div class='map' id='map" + day.cartodb_id + "'></div>");
        if (day.footer)       $appointment.append("<p class='footer'>" + day.footer + "</p>");


        // Map if exists
        if (day.position) {

          var map = new L.Map('map' + day.cartodb_id, {scrollWheelZoom: false})
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
        var date_no_proccessed = new Date(day.when)
          , date_proccessed = date_no_proccessed.getMonthName() + " " + date_no_proccessed.getDate() + ", " + date_no_proccessed.getFullYear();

        $appointment.append("<span class='day' title='" + date_proccessed + "'></span>")


        // Type of the appointment
        var type = $("<span>").addClass("type " + day.type);
        $appointment.append(type);

        // Change side for the next
        if ($month_block.find(".left").height() > $month_block.find(".right").height()) {
          this.timeline.side = "right";
        } else if ($month_block.find(".left").height() < $month_block.find(".right").height()) {
          this.timeline.side = "left";
        }

        // Last day
        this.stats.years = day.when;
      },

      _printStats: function() {
        var $stats = $("<div>").addClass("long")
          , $list = $("<ul>");

        _.each(this.stats,function(i,stat){
          var count = i;

          if (stat == "projects") { count = "+" + i }
          if (stat == "years") {
            var today = new Date();
            count = ((today - new Date(count)) / (1000*60*60*24*30*12)).toFixed(1);
          }

          $list.append("<li class='" + stat  + "'><h2>" + count + "</h2><label>" + stat + "</label></li>")
        })

        $stats.append($list);

        this.$timeline.prepend($stats);
      },

      _showBorn: function() {
        var $born = $("<div>").addClass("long bottom");

        $born
          .append('<h1><a href="http://vizzuality.com" target="_blank">Vizzuality</a></h1>')
          .append('<p>Born on 18 November 2008</p>')
          .append('<p class="parents">by <a href="http://twitter.com/saleiva" target="_blank">Sergio Álvarez</a> and <a href="http://twitter.com/jatorre" target="_blank">Javier de la Torre</a></p>')

        this.$timeline.append($born);
      },

      _initLoader: function() {
        // Loader symlink
        this.$loader = this.$el.find("div.loader");

        // Header symlink
        this.$header = this.$el.find("header");

        //Start knob
        this.$loader.find('.dial').knob({
          width:100,
          fgColor: "#4C98D3"
        })
      },

      _updateLoader: function(rest, total) {
        var $dial = this.$loader.find(".dial");

        $dial
          .val((((total - rest + 1)/total) * 100).toFixed(0))
          .trigger('change')
          .show();
      },

      _stopLoader: function() {
        var self = this;
        this.$loader.animate({
          marginTop:"-50px",
          opacity:0
        }, 300, function(){
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
      urlRoot: "http://xavijam.cartodb.com/api/v2/sql/"
    });


    window.vizzualityTimeline = new VizzualityView({
      el: $("body"),
      model: new VizzualityModel()
    });
  })