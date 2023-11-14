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


        // adding static pointers
    fetch('/api/gas_station_data')
            .then(response => response.json())
            .then(data => {
                data.forEach(station => {
                    var lon = station.lon;
                    var lat = station.lat;
                    var name = station.name;
                    var brand = station.brand;
                    var station_lonlat_obj = createLonLatObject(lon, lat);
                    var marker;

                    if (name == 'Orlen' || brand == 'Orlen') {
                        marker = new ol.Marker(station_lonlat_obj, new ol.Icon('/static/img/gas_station_point_orlen.png', marker_size));
                    } else if (name == 'BP' || brand == 'BP') {
                        marker = new ol.Marker(station_lonlat_obj, new ol.Icon('static/img/gas_station_point_bp.png', marker_size));
                    } else if (name == 'Lotos' || brand == 'Lotos') {
                        marker = new ol.Marker(station_lonlat_obj, new ol.Icon('static/img/gas_station_point_lotos.png', marker_size));
                    } else if (name == 'Circle K' || brand == 'Circle K') {
                        marker = new ol.Marker(station_lonlat_obj, new ol.Icon('static/img/gas_station_point_circle_k.png', marker_size));
                    } else if (name == 'Amica' || brand == 'Amica') {
                        marker = new ol.Marker(station_lonlat_obj, new ol.Icon('static/img/gas_station_point_amica.png', marker_size));
                    } else if (name == 'Moya' || brand == 'Moya') {
                        marker = new ol.Marker(station_lonlat_obj, new ol.Icon('static/img/gas_station_point_moya.png', marker_size));
                    } else if (name == 'Shell' || brand == 'Shell') {
                        marker = new ol.Marker(station_lonlat_obj, new ol.Icon('static/img/gas_station_point_shell.png', marker_size));
                    } else {
                        marker = new ol.Marker(station_lonlat_obj, new ol.Icon('static/img/gas_station.png', marker_size));
                    }
                    addPopupToMarker(marker, `<b>Name: ${name}</b><br><b>Brand: ${brand}</b><br><b>Coordinates: ${lon}, ${lat}</b>`);
                    markers.addMarker(marker);
                });
            })
            .catch(error => {
                console.error('Error during download data from API:', error);
            });
    }

    function addPopupToMarker(marker, popupText) {
        var popup = new ol.Popup.FramedCloud(
            "popup",
            marker.lonlat,
            null,
            popupText,
            null,
            true
        );
        marker.events.register("click", marker, function () {
            if (map.popups.length) {
                map.removePopup(map.popups[0]);
            }
            map.addPopup(popup);
        });
    }

    // Create LonLat object with proper projection (with degrees scale)
    function createLonLatObject(lon, lat) {
        return new ol.LonLat(lon, lat).transform(wgs84, map.getProjectionObject());
    }

    init();
});
