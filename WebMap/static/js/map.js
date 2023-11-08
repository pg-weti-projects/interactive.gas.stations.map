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


        // adding static markers
        fetch('/api/gas_station_data')
            .then(response => response.json())
            .then(data => {
                data.forEach(station => {
                    var lon = station.lon;
                    var lat = station.lat;
                    var name = station.name;
                    var brand = station.brand;
                    var station_lonlat_obj = createLonLatObject(lon, lat);
                    if(name == 'Orlen' || brand == 'Orlen') {
                        var station_icon_Orlen = new ol.Icon('/static/img/user_location__point_orlen.png', marker_size);
                        markers.addMarker(new ol.Marker(station_lonlat_obj, station_icon_Orlen));
                    }
                    else if (name == 'BP' || brand == 'BP') {
                        var station_icon_BP = new ol.Icon('static/img/user_location_point_bp.png', marker_size);
                        markers.addMarker(new ol.Marker(station_lonlat_obj, station_icon_BP));
                    }
                    else if (name == 'Lotos' || brand == 'Lotos') {
                        var station_icon_lotos = new ol.Icon('static/img/user_location_point_lotos.png', marker_size);
                        markers.addMarker(new ol.Marker(station_lonlat_obj, station_icon_lotos));
                    }
                    else if (name == 'Circle K' || brand == 'Circle K') {
                        var station_icon_circle_k = new ol.Icon('static/img/user_location_point_circle_k.png', marker_size);
                        markers.addMarker(new ol.Marker(station_lonlat_obj, station_icon_circle_k));
                    }
                    else if (name == 'Amica' || brand == 'Amica') {
                        var station_icon_amica = new ol.Icon('static/img/user_location_point_amica.png', marker_size);
                        markers.addMarker(new ol.Marker(station_lonlat_obj, station_icon_amica));
                    }
                    else if (name == 'Moya' || brand == 'Moya') {
                        var station_icon_moya = new ol.Icon('static/img/user_location_point_moya.png', marker_size);
                        markers.addMarker(new ol.Marker(station_lonlat_obj, station_icon_moya));
                    }
                    else if (name == 'Shell' || brand == 'Shell') {
                        var station_icon_shell = new ol.Icon('static/img/user_location_point_shell.png', marker_size);
                        markers.addMarker(new ol.Marker(station_lonlat_obj, station_icon_shell));
                    }
                    else
                    {
                        var station_icon_other = new ol.Icon('static/img/gas_station.png', marker_size);
                        markers.addMarker(new ol.Marker(station_lonlat_obj, station_icon_other));
                    }
                });
            })
            .catch(error => {
                console.error('Error during download data from API:', error);
            });
    }

    // Create LonLat object with proper projection (with degrees scale)
    function createLonLatObject(lon, lat) {
        return new ol.LonLat(lon, lat).transform(wgs84, map.getProjectionObject());
    }

    init();
});
