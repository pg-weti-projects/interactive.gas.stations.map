$(document).ready(function () {
    var ol = OpenLayers;

    // App settings
    var wgs84 = new ol.Projection("EPSG:4326");
    var options = {
        projection: wgs84,
        displayProjection: wgs84,
        units: "degrees",
    };

    var zoomLevel = 7;
    var map;
    var center_pl_lon = 19;
    var center_pl_lat = 52;
    var user_marker_lon = null;
    var user_marker_lat = null;

    var markersLayer;
    var drawControl = null;

    // Initialize all basic components on the website
    function init() {
        map = new ol.Map('map', options);

        var osm = new ol.Layer.OSM("OSM Map");
        map.addLayer(osm);

        // add switch menu to change layers
        var switcher = new ol.Control.LayerSwitcher();
        map.addControl(switcher);

        // adding mouse position in left down corner ( in degrees )
        var mouse_position = new ol.Control.MousePosition();
        map.addControl(mouse_position);

        // set poland as center of map
        var lonLat = createLonLatObject(center_pl_lon, center_pl_lat);
        map.setCenter(lonLat, zoomLevel);

        markersLayer = new ol.Layer.Vector("Markers", {
            styleMap: new ol.StyleMap({
                'default': {
                    externalGraphic: 'static/img/user_location_point.png',
                    graphicWidth: 30,
                    graphicHeight: 30,
                    graphicXOffset: -15,
                    graphicYOffset: -30,
                    graphicZIndex: 1,
                }
            })
        });
        map.addLayer(markersLayer);

        $(".add-marker").click(function () {
            showAlert("Place marker on the map", "info");
            enableMarkerAddMode();
        });
    }

    // Enable Marker mode to add marker on the map
    function enableMarkerAddMode() {
        if (drawControl) {
            map.removeControl(drawControl);
            drawControl.deactivate();
            drawControl.destroy();
            drawControl = null;
        }

        drawControl = new ol.Control.DrawFeature(markersLayer, ol.Handler.Point);
        map.addControl(drawControl);
        drawControl.activate();

        drawControl.events.on({
            featureadded: function (event) {
                var feature = event.feature;
                var user_marked_lonlat = feature.geometry.clone().transform(map.getProjectionObject(), wgs84);

                // set marker lon and lat to global variables
                user_marker_lon = user_marked_lonlat.x;
                user_marker_lat = user_marked_lonlat.y;

                map.removeControl(drawControl);
                drawControl.deactivate();
                drawControl.destroy();
                drawControl = null;

                markersLayer.removeAllFeatures();
                markersLayer.addFeatures(feature);
                $(".add-marker").text("Change Marker Location");
                $('.find-nearest-station').prop('disabled', false);
                showAlert(`Successfully placed marker (${user_marker_lon}, ${user_marker_lat})`, "success");
            }
        });
    }

    // Creating lon lat object with correct projection
    function createLonLatObject(lon, lat) {
        return new ol.LonLat(lon, lat).transform(wgs84, map.getProjectionObject());
    }

    // Listens if remove-marker button has been clicked and remove user marker from map.
    $(".remove-marker").click(function () {
    if (user_marker_lon !== null && user_marker_lat !== null) {
        markersLayer.removeAllFeatures();

        user_marker_lon = null;
        user_marker_lat = null;

        $('.find-nearest-station').prop('disabled', true);

        $(".add-marker").text("Add marker");

        showAlert("Marker removed", "info");
    } else {
        showAlert("No marker to remove", "warning");
    }
});

    init();
});
