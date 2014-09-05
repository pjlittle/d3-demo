/**
 * @file Contains D3 demo functionality, illustrating how to use D3 to create a basic bar chart.
 * @author P.J. Little <pj.little@base2s.com>
 * @copyright 2014 Base2 Solutions.  All rights reserved.
 */

// define a bar chart object to encapsulate all functionality/logic, including fetching data and D3 calls
barChart = {};

// remember to be a good citizen and don't pollute the global namespace, otherwise you face the
// wrath of javascript pros around the world...
(function(chart, $, d3) {

    var dataUrl = 'http://data.seattle.gov/resource/65db-xm6k.json?',
        queryString = '$where=date%3E%3D%27{start}%27+AND+date%3C%27{end}%27';

    var hours = [],
        updateGraph,
        testData;

    // define all used DOM element ids in one place.
    var domElements = {
        main: {
            container: '#main',
            link: '#mainLink'
        },
        about: {
            container: '#about',
            link: '#aboutLink'
        },
        inputs: {
            month: '#month',
            year: '#year'
        },
        visualizations: {
            container: '#visualizations',
            loader: '#loader',
            graph: '#graphContainer',
            stats: {
                totalRides: '#totalRides',
                singleDay: '#singleDay',
                dailyTotal: '#dailyTotal'
            }
        },
        message: '#message'
    };

    var barPadding = 5;

    /**
     * Defines a public initialization function.  This initializes the bar chart by rendering basic scaffolding and
     * wiring up needed DOM events.  This will initiate an initial data fetch, using default month/year values on
     * the page.
     */
    chart.init = function() {

        testData = generateTestData(24);

        for(var i=0; i<24; i++) {
            hours.push(i);
        }

        // render basic graph scaffolding once - save the returned callback to update the graph when new data is fetched.
        updateGraph = renderGraph();
        selectChanged();

        // updateGraph(testData);

        // when inputs are changed, update the graph
        $(domElements.inputs.month).change(selectChanged);
        $(domElements.inputs.year).change(selectChanged);

        // general event handlers for the page
        $(domElements.main.link).click(function() {
            $(domElements.main.container).show();
            $(domElements.about.container).hide();
        });
        $(domElements.about.link).click(function() {
            $(domElements.main.container).hide();
            $(domElements.about.container).show();
        });
    };

    /**
     * Handles the onChange event for the month/year selects.  When those values are changed,
     * it initiates an ajax data fetch.
     */
    function selectChanged() {

        var month = parseInt($(domElements.inputs.month).val());
        var year = parseInt($(domElements.inputs.year).val());
        var url = formatUrl(month, year);

        fetchData(url);
    }

    /**
     * Fetches data (HTTP GET) using the specified Url.
     * @param url
     */
    function fetchData(url) {

        // hide any previous errors, show the loader and graph opacity
        hideMessage();
        $(domElements.visualizations.loader).show();
        $(domElements.visualizations.container).css({ opacity: 0.5 });

        // queue up an HTTP GET
        setTimeout(function() {

            $.get(url, function (data) {

                try {
                    // process dataset and update the graph
                    var results = processBikeData(data);
                    updateGraph(results.monthlyTotalsPerHour);

                    // no data? display a warning message and bail
                    if (data.length === 0) {
                        showMessage(false, 'No data was found for the provided inputs. Try selecting a different ' +
                            'month/year.');
                        $(domElements.visualizations.stats.totalRides).text('N/A');
                        $(domElements.visualizations.stats.singleDay).text('N/A');
                        $(domElements.visualizations.stats.dailyTotal).text('N/A');
                        return;
                    }

                    // update facts text
                    $(domElements.visualizations.stats.totalRides).text(results.totalRides);
                    $(domElements.visualizations.stats.singleDay).text(results.busiestDate.toUTCString() + ' (' + results.busiestDateCount + ')');

                    var busiestDayOfWeek,
                        max = 0;
                    for(var i=0; i<results.dailyTotals.length; i++) {
                        if (results.dailyTotals[i] > max) {
                            max = results.dailyTotals[i];
                            busiestDayOfWeek = i;
                        }
                    }

                    var day = day2String(busiestDayOfWeek);
                    $(domElements.visualizations.stats.dailyTotal).text(day + ' (' + max + ')');
                } catch(e) {
                    showMessage(true, 'Nice work, you found a bug, er, I mean hidden feature!');
                    console.error('Pretty things break - ' + e.stack);
                }
            }).fail(function (xhr, text, errorThrown) {
                showMessage(true, ':( No bueno - unable to fetch data for the provided month/year. Try specifying different ' +
                    'inputs or refresh the page.');
                console.error('Error fetching data - ' + xhr.responseText);
            }).always(function() {
                $(domElements.visualizations.loader).hide();
                $(domElements.visualizations.container).css({ opacity: 1 });
            });
        }, 1000);
    }

    /**
     * Renders the basic layout/scaffolding for the bar chart.  Returns a callback, used to update the graph with data.
     * @returns {updateData}
     */
    function renderGraph() {

        // using an absolute width/height.  SVG is not supposed to support percentage values, but most browsers
        // support it.  As a result, most D3 visuals are fixed size.  This can make responsiveness a challenge.
        var width = 700,
            height = 400,
            margin = { top: 40, right: 60, bottom: 40, left: 40},
            graphWidth = width - margin.left - margin.right,
            graphHeight = height - margin.top - margin.bottom;

        // create root SVG element - this will host the graph
        var svg = d3.select(domElements.visualizations.graph)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

        // create the x axis - just hours from 0 - 23
        var x = d3.scale.ordinal()
            .domain(hours)
            .rangeRoundBands([0, graphWidth], 0.1);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient('bottom')
            .tickPadding(8);

        // create y scale using the largest value in the dataset as the max domain value
        // and use the full height of the svg container as the rendering range.
        var y = d3.scale.linear()
            .range([graphHeight, 0], 0);

        // create the y-axis, orientated on the left
        var yAxis = d3.svg.axis()
            .scale(y)
            .orient('left');

        // render both x/y axis on the graph
        svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0, ' + (graphHeight) + ')')
            .call(xAxis);

        svg.append('g')
            .attr('class', 'y axis')
            .call(yAxis);

        // separate graphics container for mouseover labels
        var g = svg.append('g');

        // return an update function/callback.  What, why?!  short answer?  creating the graph and actually rendering
        // data are separate operations.  Thanks to javascript closures, we still have access to objects in the
        // parent scope.
        return function updateData(data) {

            // update y domain using the largest value in the dataset as the max domain value
            var domainMax = d3.max(data);
            var buffer = domainMax * 0.1;
            y.domain([0, domainMax + buffer]);

            // animate the rescale - remember, pretty things break!
            var transition = svg.transition().duration(1000);
            transition.select('.y.axis').call(yAxis);

            // finally - we actually render the data
            svg.selectAll('rect')
                .data(data)     // data set to show
                .enter()        // for each data member, do the following:
                .append('rect')
                .attr('class', function(d, i) {
                    return getColorBand(d, domainMax) + ' bar';
                })
                .attr('x', function(d, i) {
                    return x(i);
                })
                .attr('y', function(d, i) {
                    return graphHeight - barPadding;
                })
                .attr('width', function(d, i) {
                    return x.rangeBand();
                })
                .attr('height', function(d, i) {        // height is 0?!  This gets set to the correct value in the transition below...
                    return 0;
                })
                .on('mouseover', function(d, i) {

                    // use the existing scale factor to determine where to draw the label
                    var xCoord = x(i),
                        yCoord = y(d);

                    // draw the label - currently just displaying the data value
                    g.append('text')
                        .attr('x', xCoord + x.rangeBand())
                        .attr('y', yCoord - barPadding)
                        .attr('fill', '#efefef')
                        .attr('dx', -x.rangeBand() / 2)
                        .attr('text-anchor', 'middle')
                        .text(d);

                    // update css class to draw a border around the selected bar
                    this.classList.add('border');
                })
                .on('mouseout', function(d) {

                    // remove the label and restore the css class to its original value
                    g.selectAll('text').remove();
                    this.classList.remove('border');
                });

            // more fancy transitions. This animates the bars on the graph, effectively by having them 'grow'
            // from the bottom by animating the y and height attributes.
            svg.selectAll('rect.bar')
                .transition()
                .delay(200)
                .duration(2000)
                .attr('y', function(d, i) {
                    return y(d);
                })
                .attr('height', function(d, i) {
                    var barHeight = graphHeight - barPadding - y(d);
                    return (barHeight > 0 ) ? barHeight : 0;
                });
        };
    }

    /**
     * Determines the color fill of a bar by splitting the spectrum of values into thirds.
     * @param value The data value.
     * @param domainMax The maximum data value in the dataset.
     * @returns {string} A string representing a CSS class to color low, medium and high data values.
     */
    function getColorBand(value, domainMax) {

        var third = domainMax / 3;
        if (value <= third) {
            return 'low';
        } else if (value <= (third * 2)) {
            return 'medium';
        } else {
            return 'high';
        }
    }

    /**
     * Aggregates all returned bike data, per hour.
     * @param arr The data returned from the Web service.
     * @returns {{}} An aggregated, reduced data object, used directly to update the graph.
     */
    function processBikeData(arr) {

        var output = {};
        output.monthlyTotalsPerHour = [];
        output.dailyTotals = [];
        output.busiestDate = null;
        output.busiestDateCount = 0;
        output.totalRides = 0;

        for (var i=0; i<24; i++) {
            output.monthlyTotalsPerHour[i] = 0;
        }

        for (i=0; i<7; i++) {
            output.dailyTotals[i] = 0;
        }

        var previousDay = 0;
        var dailyTotal = 0;

        for (i=0; i<arr.length; i++) {

            var item = arr[i],
                date = new Date(item.date),
                day = date.getUTCDate(),
                nbCount = parseInt(item.fremont_bridge_nb),
                sbCount = parseInt(item.fremont_bridge_sb),
                hourlyTotal = nbCount + sbCount;

            if (isNaN(nbCount) || isNaN(sbCount) || isNaN(hourlyTotal)) {
                console.warn('Bad data detected for ' + date.toUTCString() + '\nitem=\n' + JSON.stringify(item) + '\nnbCount=' + nbCount + ', sbCount=' + sbCount + ', hourlyTotal=' + hourlyTotal);
                continue;
            }

            if (previousDay === 0) {
                previousDay = day;
            }

            if (day !== previousDay) {
                previousDay = day;
                if (dailyTotal > output.busiestDateCount) {
                    output.busiestDate = date;
                    output.busiestDateCount = dailyTotal;
                }

                dailyTotal = 0;
            }

            dailyTotal += hourlyTotal;

            output.totalRides += hourlyTotal;
            output.monthlyTotalsPerHour[date.getUTCHours()] += hourlyTotal;
            output.dailyTotals[date.getUTCDay()] += hourlyTotal;
        }

        return output;
    }

    /**
     * Formats the selected month and year into ISO 8601 compliant query string values.  This includes year/month
     * rollover calculations.
     * @param month The starting month, an integer between 1-12.
     * @param year The starting year, an integer.
     * @returns {string} A formatted url that can be used to fetch data.
     */
    function formatUrl(month, year) {

        var start = year + '-' + padMonth(month) + '-01',
            end;

        // NOTE: ISO dates need to be zero padded
        if (month === 12) {
            end = (year + 1) + '-01-01';
        } else {
            end = year + '-' + padMonth(month + 1) + '-01';
        }

        var url = dataUrl + queryString
            .replace('{start}', start)
            .replace('{end}', end);

        return url;
    }

    /**
     * Displays warning and error messages.  Used when an unhandled exception is thrown or when no data is returned
     * from the serivce.
     * @param isError Simple bool used to indicate an error vs a warning.
     * @param message The message to display to the user.
     */
    function showMessage(isError, message) {

        var messageDiv = $(domElements.message);
        messageDiv.text(message);

        // remove all classes
        messageDiv.removeClass();
        messageDiv.addClass('alert');

        if (isError) {
            messageDiv.addClass('alert-danger');
        } else {
            messageDiv.addClass('alert-warning');
        }

        messageDiv.show();
    }

    /**
     * Hides the error/warning message container.
     */
    function hideMessage() {
        $(domElements.message).hide();
    }

    /**
     * Pads any month value, less than 10, with a leading zero.  Required for ISO 8601 date/time values.
     * @param month
     * @returns {*}
     */
    function padMonth(month) {

        if (month < 10) {
            return '0' + month;
        }

        return month.toString();
    }

    /**
     * Generates an array of random test values, used to populate the graph without using the Web service.
     * @param num The number of data elements to generate.
     * @returns {Array} An array of random test values.
     */
    function generateTestData(num) {

        var arr = [];
        for(var i=0; i< num; i++) {
            arr.push(random(0, 20000));
        }

        return arr;
    }

    /**
     * Returns a random number between the specified min/max value - both are inclusive.
     * @param min The minimum, inclusive value.
     * @param max The maximum, inclusive value.
     * @returns {*} A random integer between the min/max values, inclusively.
     */
    function random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Helper function to convert Date.getUTCDate() integers into their string equivalents.
     * @param day An integer represending the day of the week, between 0-7.
     * @returns {string} A human-readable string representation of the day value.
     */
    function day2String(day) {

        switch(day) {
            case 0: {
                return 'Sunday';
            }
            case 1: {
                return 'Monday';
            }
            case 2: {
                return 'Tuesday';
            }
            case 3: {
                return 'Wednesday';
            }
            case 4: {
                return 'Thursday';
            }
            case 5: {
                return 'Friday';
            }
            case 6: {
                return 'Saturday';
            }
            default: {
                return 'Unknown';
            }
        }
    }

})(barChart, $, d3);

// you know the drill... initialize the bar chart with an initial data fetch, when the DOM is ready
$(document).ready(barChart.init);
