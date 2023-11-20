import {createMapLayers, createRouteLayer, createUserMarkerLayer, createGasStationsMarkersLayers} from './modules/layers.js'
import {generateFeaturesMarkersEachStation} from './modules/markers.js'

$(document).ready(function () {

    // General Settings
    const defaultProjection = 'EPSG:4326';
    const apiKey = 'AAPKaf77b11595124e6295c9f2679a38fb9dJbeoPRXhOddgVhIXAURQSmut9oqQkOmIzIDqSr7EK-_Vyjo3Wm_mYzt-dUi6WT49';

    // Map Settings
    const mapLayersStyles = {
        'OSMLayer': 0,
        'RoadOnDemand': 1,
        'Aerial': 2,
        'AerialWithLabelsOnDemand': 3,
        'CanvasDark': 4,
    };
    let latestMapStyle = 'OSMLayer';
    let layersStyles;
    const zoomLevel = 7;
    const centerPlCoords = [19, 52];
    let map;

    // Gas Stations markers settings
    const gasStationsMarkersScale = 0.03;
    const gasStationsMarkersAnchor = [0.5, 1];
    let gasStationsMarkersLayers = {
        'Amic': null,
        'BP': null,
        'Circle K': null,
        'Lotos': null,
        'Moya': null,
        'Orlen': null,
        'Other': null,
        'Shell': null
    }

    // User marker settings
    const userMarkerScale = 0.05;
    const userMarkerAnchor = [0.5, 1];
    let userMarkerLayer;
    let userMarkerCoords = null;

    // Route settings
    const routeStrokeStyle = { color: "hsl(205, 100%, 50%)", width: 4, opacity: 0.6 };
    let routeLayer;

    // Other settings
    let drawControl = null;
    let roadOnMap = false;
    let popover;


    // Initialize all basic components on the website
    function init() {
        layersStyles = createMapLayers(mapLayersStyles);
        map = new ol.Map({
            layers: layersStyles,
            target: 'map',
            projection: defaultProjection,
            displayProjection: defaultProjection,
            units: 'degrees',
        });

        // Add additional layers to the map
        routeLayer = createRouteLayer(routeStrokeStyle)
        map.addLayer(routeLayer);
        userMarkerLayer = createUserMarkerLayer(userMarkerScale, userMarkerAnchor)
        map.addLayer(userMarkerLayer);

        gasStationsMarkersLayers = createGasStationsMarkersLayers(gasStationsMarkersLayers);

        for (let layer in gasStationsMarkersLayers)
        {
            map.addLayer(gasStationsMarkersLayers[layer]);
        }

        // Set Zoom and Center Of Poland as the first view when website is loaded
        map.getView().setCenter(ol.proj.fromLonLat(centerPlCoords));
        map.getView().setZoom(zoomLevel);

        // Add mouse position checker to display mouse coordinates
        let mousePositionControl = new ol.control.MousePosition({
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

                // make an AJAX request to the Flask route to get nearest station
                $.ajax({
                    url: `/api/find_nearest_station/${userMarkerCoords[0]}/${userMarkerCoords[1]}`,
                    type: 'GET',
                    dataType: 'json',
                    success: function (response) {
                        const stationCoords = response.stationCoords;
                        updateRoute(userMarkerCoords, stationCoords);
                    },
                    error: function (error) {
                        showAlert('Error occurred while finding the nearest station.', 'danger');
                    }
                });
            } else {
                showAlert('Please place a marker first.', 'warning');
            }
        });

        $('.filters-buttons').change(function() {
            let checkboxValue = $(this).val();

            if ($(this).is(':checked')) {
                gasStationsMarkersLayers[checkboxValue].setVisible(true);
            } else {
                gasStationsMarkersLayers[checkboxValue].setVisible(false);
            }
        });

        // Handle changing map style
        $('.dropdown-menu input[type="radio"]').change(function() {
            let selectedValue = $(this).val();

            layersStyles[mapLayersStyles[latestMapStyle]].setVisible(false);

            layersStyles[mapLayersStyles[selectedValue]].setVisible(true);
            latestMapStyle = selectedValue;
        });

        assignMarkersForEachGasStationLayer();
        addPopupWindowLogic();
    }

    /*Assign all Feature Objects to specific  gas station Layer*/
    function assignMarkersForEachGasStationLayer() {
        generateFeaturesMarkersEachStation(gasStationsMarkersScale, gasStationsMarkersAnchor)
        .then(features => {

            for(let key in gasStationsMarkersLayers) {
                let station_features = features[key];

                const gasStationsMarkersSource = new ol.source.Vector({
                    features: station_features,
                });
                gasStationsMarkersLayers[key].setSource(gasStationsMarkersSource);
            }
        })
        .catch(error => {
            console.error('An error occurred during try to generate all gas stations markers:', error);
        });
    }


    /*Add route to routeLayer between two points (default user marker and station marker). Displays information
    * about route ( Distance and Travel Time ) */
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

            const features = geojson.readFeatures(response.routes.geoJson);


            const routeFeatures = features.map((feature) => {
                const travelTime = parseFloat(response.directions[0].summary.totalDriveTime).toFixed(0);
                const totalKilometers = parseFloat(response.routes.features[0].attributes.Total_Kilometers).toFixed(2);

                return new ol.Feature({
                    geometry: feature.getGeometry(),
                    name: `<b>Distance: ${totalKilometers} km</b><br><b>Travel time: ${travelTime} min</b>`,
                });
            });

            const routeSource = new ol.source.Vector({
                features: routeFeatures,
            });
            routeLayer.setSource(routeSource);

            roadOnMap = true;

            showAlert('Found nearest station! Drawing route...', 'success');
        })
        .catch((error) => {
            console.error('An error occurred during try to get route from points!', error);
            showAlert("You can't find route to this point! Move your marker to another place.", "warning");
          });
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
            source: userMarkerLayer.getSource(),
            type: 'Point',
        });

        map.addInteraction(drawControl);
        drawControl.setActive(true);

        drawControl.on('drawend', function (event) {
            map.removeInteraction(drawControl);
            drawControl.setActive(false);

            userMarkerLayer.getSource().clear();

            $(".add-marker").text('Change Marker Location');
            $('.find-nearest-station').prop('disabled', false);

            removeRouteIfExist();

            const user_marked_lonlat = event.feature.getGeometry().clone().transform('EPSG:3857', defaultProjection);
            userMarkerCoords = user_marked_lonlat.getCoordinates();
            console.log('User marker coords: (', userMarkerCoords[0], ',', userMarkerCoords[1], ')');
            showAlert(`Successfully placed marker (${userMarkerCoords[0]}, ${userMarkerCoords[1]})`, 'success');
        });
    }


    /*Add handler for clicking on Feature objects. When user click on this object (e.g. Marker, Route), a popup will
    * appear with information about it. When user hover over Feature object, cursor will be changed. */
    function addPopupWindowLogic() {
        const element = document.getElementById('popup');

        const popup = new ol.Overlay({
          element: element,
          positioning: 'bottom-center',
          stopEvent: false,
        });
        map.addOverlay(popup);

        // Display popup on click
        function disposePopover() {
            if (popover) {
                popover.dispose();
                popover = undefined;
            }
        }

        // Handle click on Feature object
        map.on('click', function (evt) {
            const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
                return feature;
            });

            disposePopover();
            if (!feature || !feature.get('name')) {
                return;
            }
            popup.setPosition(evt.coordinate);

            popover = new bootstrap.Popover(element, {
                placement: 'top',
                html: true,
                content: feature.get('name'),
            });
            popover.show();
        });

        // Change pointer when user hover over Feature object
        map.on('pointermove', function (event) {
            const pixel = event.pixel;
            const hit = map.hasFeatureAtPixel(pixel);
            const targetElement = map.getTargetElement();
            if (hit) {
                targetElement.style.cursor = 'pointer';
            } else {
                targetElement.style.cursor = '';
            }
        });

        // Close the popup when user click on the map and do something
        map.on('movestart', disposePopover);
    }


    /*Listens if remove-marker button has been clicked and removes the user marker from the map.*/
    $(".remove-marker").click(function () {
        if (userMarkerCoords !== null) {
            removeRouteIfExist();
            userMarkerLayer.getSource().clear();

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
