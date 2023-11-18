$(document).ready(function () {
    // App settings
    const defaultProjection = 'EPSG:4326';

    var apiKey = 'AAPKaf77b11595124e6295c9f2679a38fb9dJbeoPRXhOddgVhIXAURQSmut9oqQkOmIzIDqSr7EK-_Vyjo3Wm_mYzt-dUi6WT49';

    const zoomLevel = 9;
    const centerPlCoords = [19, 52];

    var map;
    var drawControl = null;
    var userMarkerCoords = null;
    var markersLayer;

    var routeLayer;
    var roadOnMap = false;

    // markers settings
    const markersScale = 0.025;
    const markersAnchor = [0.5, 1];

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
        addGasStationsMarkersLayer();

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

        // adding static pointers

        // TEMP ONE MARKER
//
//        var lon = 19;
//        var lat = 52;
//
//        let features = [];
//
//        const iconFeature = new ol.Feature({
//            geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat])),
//            name: 'TEMP MARKER',
//        });
//
//        const iconStyle = new ol.style.Style({
//            image: new ol.style.Icon({
//                src: '/static/img/gas_station_point_orlen.png',
//                scale: markersScale,
//                anchor: markersAnchor,
//            }),
//        });
//        iconFeature.setStyle(iconStyle);
//        features.push(iconFeature);
//
//
//        const iconFeature2 = new ol.Feature({
//            geometry: new ol.geom.Point(ol.proj.fromLonLat([19.5, lat])),
//            name: 'DRUGI TEMP MARKER',
//        });
//
//        const iconStyle2 = new ol.style.Style({
//            image: new ol.style.Icon({
//                src: '/static/img/gas_station_point_orlen.png',
//                scale: markersScale,
//                anchor: markersAnchor,
//            }),
//        });
//        iconFeature2.setStyle(iconStyle2);
//        features.push(iconFeature2);

        featuress = generateAllMarkers();


        const vectorSource = new ol.source.Vector({
            features: features,
        });

        const newMarkersLayer = new ol.layer.Vector({
            source: vectorSource,
        });
        map.addLayer(newMarkersLayer);

        const element = document.getElementById('popup');

        const popup = new ol.Overlay({
          element: element,
          positioning: 'bottom-center',
          stopEvent: false,
        });
        map.addOverlay(popup);

        let popover;
        function disposePopover() {
          if (popover) {
            popover.dispose();
            popover = undefined;
          }
        }
        // display popup on click
        map.on('click', function (evt) {
          const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
            return feature;
          });
          disposePopover();
          if (!feature) {
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

        // change mouse cursor when over marker
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

        // Close the popup when the map is moved
        map.on('movestart', disposePopover);
    };


    function generateAllMarkers() {
        let features = [];
        fetch('/api/gas_station_data')
        .then(response => response.json())
        .then(data => {
            const promises = [];

            data.forEach(station => {
                const promise = new Promise((resolve, reject) => {
                    var lon = station.lon;
                    var lat = station.lat;
                    var name = station.name;
                    var brand = station.brand;
                    var station_lonlat_obj = ol.proj.fromLonLat([lon, lat]);
                    var markerStyle;

                    if (name == 'Orlen' || brand == 'Orlen') {
                        markerStyle = new ol.style.Style({
                            image: new ol.style.Icon({
                                src: '/static/img/gas_station_point_orlen.png',
                                scale: markersScale,
                                anchor: markersAnchor,
                            })
                        });
                    } else if (name == 'BP' || brand == 'BP') {
                        markerStyle = new ol.style.Style({
                            image: new ol.style.Icon({
                                src: 'static/img/gas_station_point_bp.png',
                                scale: markersScale,
                                anchor: markersAnchor,
                            })
                        });
                    } else if (name == 'Lotos' || brand == 'Lotos') {
                        markerStyle = new ol.style.Style({
                            image: new ol.style.Icon({
                                src: 'static/img/gas_station_point_lotos.png',
                                scale: markersScale,
                                anchor: markersAnchor,
                            })
                        });
                    } else if (name == 'Circle K' || brand == 'Circle K') {
                        markerStyle = new ol.style.Style({
                            image: new ol.style.Icon({
                                src: 'static/img/gas_station_point_circle_k.png',
                                scale: markersScale,
                                anchor: markersAnchor,
                            })
                        });
                    } else if (name == 'Amic' || brand == 'Amic') {
                        markerStyle = new ol.style.Style({
                            image: new ol.style.Icon({
                                src: 'static/img/gas_station_point_amica.png',
                                scale: markersScale,
                                anchor: markersAnchor,
                            })
                        });
                    } else if (name == 'Moya' || brand == 'Moya') {
                        markerStyle = new ol.style.Style({
                            image: new ol.style.Icon({
                                src: 'static/img/gas_station_point_moya.png',
                                scale: markersScale,
                                anchor: markersAnchor,
                            })
                        });
                    } else if (name == 'Shell' || brand == 'Shell') {
                        markerStyle = new ol.style.Style({
                            image: new ol.style.Icon({
                                src: 'static/img/gas_station_point_shell.png',
                                scale: markersScale,
                                anchor: markersAnchor,
                            })
                        });
                    } else {
                        markerStyle = new ol.style.Style({
                            image: new ol.style.Icon({
                                src: 'static/img/gas_station_point_other.png',
                                scale: markersScale,
                                anchor: markersAnchor,
                            })
                        });
                    }

                    let marker = new ol.Feature({
                        geometry: new ol.geom.Point(station_lonlat_obj)
                    });
                    marker.setStyle(markerStyle);

                    features.push(marker);

                    resolve();
                });
                promises.push(promise);
            });

            Promise.all(promises)
              .then(() => {
                console.log('Przypisuje features i tworze layer');
                console.log("FEATUERKI:", features);
                return features;
              })
              .catch(error => {
                console.error('Wystąpił błąd podczas operacji na stacjach:', error);
              });
        })
        .catch(error => {
            console.error('Error during download data from API:', error);
        });


    };


    function addPopupToMarker(marker, popupText) {
        console.log("POPUP FUNC WORKING");

        console.log(marker)
        var popup = new ol.Overlay({
            element: document.createElement('div'),
            positioning: 'bottom-center',
            stopEvent: false
        });

        var popupContent = document.createElement('div');
        popupContent.innerHTML = popupText;
        popup.getElement().appendChild(popupContent);

        marker.on('click', function (evt) {
            console.log("Marker clicked!");
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
                    src: 'static/img/user_marker.png',
                    scale: 0.05,
                    anchor: [0.5, 1],
                }),
            }),
            title: 'Markers Vector Layer'
        });
        map.addLayer(markersLayer);
    }

    function addGasStationsMarkersLayer() {
        gasStationsMarkersLayer = new ol.layer.Vector({
            source: new ol.source.Vector(),
            title: 'Gas Stations Markers Vector Layer'
        });
        map.addLayer(gasStationsMarkersLayer);
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
