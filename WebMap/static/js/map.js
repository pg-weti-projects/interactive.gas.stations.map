$(document).ready(function () {

    // General settings
    var apiKey = "ApTJzdkyN1DdFKkRAE6QIDtzihNaf6IWJsT-nQ_2eMoO4PN__0Tzhl2-WgJtXFSp";
    var ol = OpenLayers;


    // App settings
    var wgs84 = new ol.Projection("EPSG:4326");
    var options = {
        projection: wgs84,
        displayProjection: wgs84,
        units: "degrees",
    };

    // Map settings
    var zoomLevel = 7;
    var map;
    var center_pl_lon = 19;
    var center_pl_lat = 52;
    var marker_size = new ol.Size(30, 30);



    function init(){
        // normal map
        var osm = new ol.Layer.OSM("OSM Map");

        // Marked gas stations
        var markers = new ol.Layer.Markers("Gas Stations");

        map = new ol.Map('map', options);

        // normal layer
        map.addLayers([osm, markers]);

        // add switch menu to change layers
        var switcher = new ol.Control.LayerSwitcher();
        map.addControl(switcher);

        // adding mouse position in left down corner ( in degrees )
        var mouse_position = new ol.Control.MousePosition();
        map.addControl(mouse_position);

        // set poland as center of map
        var lonLat = createLonLatObject(center_pl_lon, center_pl_lat);
        map.setCenter(lonLat, zoomLevel);


        // adding static markers -- EXAMPLES FOR FUTURE

        // orlen station
        var amic_gru_lon = 18.7325591;
        var amic_gru_lat = 53.4530299;

        var gru_lonlat_obj = createLonLatObject(amic_gru_lon, amic_gru_lat);
        var station_icon = new ol.Icon('static/img/gas_station.png', marker_size);
        markers.addMarker(new ol.Marker(gru_lonlat_obj, station_icon));

        // user marker
        var user_lon = 18.72167;
        var user_lat = 53.41845;

        var user_lonlat = createLonLatObject(user_lon, user_lat);
        var user_icon = new ol.Icon('static/img/user_location_point.png', marker_size);
        markers.addMarker(new ol.Marker(user_lonlat, user_icon));

    }

    // Create LonLat object with proper projection (with degrees scale)
    function createLonLatObject(lon, lat) {
        return new ol.LonLat(lon, lat).transform(wgs84, map.getProjectionObject());
    }

    init();
});
