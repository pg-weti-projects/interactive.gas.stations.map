$(document).ready(function () {
    // App settings
    const defaultProjection = 'EPSG:4326';

    var apiKey = 'AAPKaf77b11595124e6295c9f2679a38fb9dJbeoPRXhOddgVhIXAURQSmut9oqQkOmIzIDqSr7EK-_Vyjo3Wm_mYzt-dUi6WT49';

    const zoomLevel = 7;
    const centerPlCoords = [19, 52];

    var map;
    var drawControl = null;
    var userMarkerCoords = null;
    var markersLayer;

    var routeLayer;
    var roadOnMap = false;

    // Initialize all basic components on the website
    function init() {
        map = new ol.Map({
            target: 'map',
            projection: defaultProjection,
            displayProjection: defaultProjection,
            units: 'degrees',
        });

        // osm layer
        var osmLayer = new ol.layer.Tile({
            source: new ol.source.OSM(),
            title: 'OSM Map',
        });
        map.addLayer(osmLayer);

        // Add layers to the map
        addRouteLayer();
        addUserMarkerLayer();

        // ADDITIONAL OLMS MAP WITH ROUTES
//        const basemapId = "arcgis/navigation";
//        const basemapURL = `https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/${basemapId}?token=${apiKey}`;
//        olms.apply(map, basemapURL)
//
//        .then(function (map) {
//            addRouteLayer();
//
//            addUserMarkerLayer();
//        });

        // set Zoom and Center Of Poland as the first view when website is loaded
        var lonLat = ol.proj.fromLonLat(centerPlCoords);
        map.getView().setCenter(lonLat);
        map.getView().setZoom(zoomLevel);

        // adding mouse position control
        var mousePositionControl = new ol.control.MousePosition({
            coordinateFormat: ol.coordinate.createStringXY(4),
            projection: defaultProjection,
            target: document.getElementById('mouse-position'),
            undefinedHTML: '&nbsp;'
        });
        map.addControl(mousePositionControl);

        $(".add-marker").click(function () {
            showAlert('Place marker on the map', 'info');
            addUserMarker();
        });

        $('.find-nearest-station').click(function () {
            if (userMarkerCoords !== null) {

                // if road is on the map, we need to remove it before mark another route
                removeRouteIfExist();

                const stationCoords = [18.7256813, 53.4409896] // TODO TEMP COORDS UNTIL WE DONT HAVE FINDING NEAREST STATION FUNC THAT RETURN COORDS

                updateRoute(userMarkerCoords, stationCoords)

                showAlert('Found nearest station!', 'success');

            } else {
                showAlert('Please place a marker first.', 'warning');
            }
        });
    }


    /*Add layer to draw route on the map between two points*/
    function addRouteLayer() {
        routeLayer = new ol.layer.Vector({
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({ color: "hsl(205, 100%, 50%)", width: 4, opacity: 0.6 })
            })
        });
        map.addLayer(routeLayer);
    }


    /*Add layer to put user marker on the map*/
    function addUserMarkerLayer() {
        markersLayer = new ol.layer.Vector({
            source: new ol.source.Vector(),
            style: new ol.style.Style({
                image: new ol.style.Icon({
                    src: 'static/img/user_location_point.png',
                    scale: 0.08,
                    anchor: [0.5, 1],
                }),
            }),
            title: 'Markers Vector Layer'
        });
        map.addLayer(markersLayer);
    }


    /*Add route to routeLayer between two points (default user marker and station marker)*/
    function updateRoute(userMarkerCoords, stationCoords) {

        const geojson = new ol.format.GeoJSON({
            defaultDataProjection: defaultProjection,
            featureProjection: "EPSG:3857"
        });

        const authentication = arcgisRest.ApiKeyManager.fromKey(apiKey);
        arcgisRest
          .solveRoute({
            stops: [userMarkerCoords, stationCoords],
            authentication
        })

        .then((response) => {
            routeLayer.setSource(
                new ol.source.Vector({
                    features: geojson.readFeatures(response.routes.geoJson)
                })
            );
        })
        roadOnMap = true;
    }


    /*Remove route from the map if exist*/
    function removeRouteIfExist() {
        if (roadOnMap) {
            routeLayer.getSource().clear();
            roadOnMap = false;
        }
    }


    /*Function activate drawing mode to add marker in place selected by user.*/
    function addUserMarker() {
        if (drawControl) {
            map.removeControl(drawControl);
            drawControl.setActive(false);
            map.removeInteraction(drawControl);
            drawControl = null;
        }

        drawControl = new ol.interaction.Draw({
            source: markersLayer.getSource(),
            type: 'Point',
        });

        map.addInteraction(drawControl);
        drawControl.setActive(true);

        drawControl.on('drawend', function (event) {
            var user_marked_lonlat = event.feature.getGeometry().clone().transform('EPSG:3857', defaultProjection);

            userMarkerCoords = user_marked_lonlat.getCoordinates();

            map.removeInteraction(drawControl);
            drawControl.setActive(false);

            markersLayer.getSource().clear();

            $(".add-marker").text('Change Marker Location');
            $('.find-nearest-station').prop('disabled', false);

            removeRouteIfExist();
            showAlert(`Successfully placed marker (${userMarkerCoords[0]}, ${userMarkerCoords[1]})`, 'success');
        });
    }


    /*Listens if remove-marker button has been clicked and removes the user marker from the map.*/
    $(".remove-marker").click(function () {
        if (userMarkerCoords !== null) {
            removeRouteIfExist();
            markersLayer.getSource().clear();

            userMarkerCoords = null;

            $('.find-nearest-station').prop('disabled', true);

            $(".add-marker").text('Add marker');

            showAlert('Marker removed', 'info');
        } else {
            showAlert('No marker to remove', 'warning');
        }
    });

    init();
});
