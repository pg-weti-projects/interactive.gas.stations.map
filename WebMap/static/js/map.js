import {createMapLayers, createRouteLayer, createUserMarkerLayer, createGasStationsMarkersLayers} from './modules/layers.js'
import {generateFeaturesMarkersEachStation, groupStationsByBrand} from './modules/markers.js'

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
        'MOL': null,
        'Other': null,
        'Shell': null,
        'Favorites': null
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
    let selectedMarker = null;


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

        /* Listens for changes in the filter buttons. If the 'Favorites' checkbox is checked,
         * it fetches the user's favorite stations from the database and updates the map markers accordingly.
         * If other checkboxes are checked/unchecked, it shows/hides the corresponding gas station markers.*/
        $('.filters-buttons').change(function() {
            let checkboxValue = $(this).val();

            if (checkboxValue === "Favorites") {
                if ($(this).is(':checked')) {
                    fetchFavoriteStationsFromDatabase().then(response => {
                        let favoriteStations = response;

                        // If the favorite filter is selected, all other filters are disabled and unchecked
                        for (let key in gasStationsMarkersLayers) {
                            if (key !== "Favorites") {
                                gasStationsMarkersLayers[key].setVisible(false);
                            }
                        }
                        $('.filters-buttons').not(this).prop('checked', false);

                        if (Array.isArray(favoriteStations)) {
                            let favoriteStationsMarkers = groupStationsByBrand(favoriteStations, gasStationsMarkersScale,
                                gasStationsMarkersAnchor, {"Favorites": []}, false);

                            const gasStationsMarkersSource = new ol.source.Vector({
                                features: favoriteStationsMarkers['markersFeatures']["Favorites"],
                            });
                            gasStationsMarkersLayers["Favorites"].setSource(gasStationsMarkersSource);
                        } else {
                            console.error('Favorite stations data is not in the expected format.');
                        }
                    }).catch(error => {
                        console.error('Error fetching favorite stations:', error);
                    });
                } else {
                    // If the user unclick favorites filter, then we check all other filters and show them on the map
                    $('.filters-buttons').not(this).prop('checked', true);
                    for (let key in gasStationsMarkersLayers) {
                        gasStationsMarkersLayers[key].setVisible(true);
                    }
                }
            } else {
                if ($(this).is(':checked')) {
                    gasStationsMarkersLayers[checkboxValue].setVisible(true);
                } else {
                    gasStationsMarkersLayers[checkboxValue].setVisible(false);
                }
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

    /*Function to fetch user's favorite stations from the database*/
    function fetchFavoriteStationsFromDatabase() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: '/api/favorite_stations',
                type: 'GET',
                success: function(response) {
                    resolve(response.favoriteStations);
                },
                error: function(error) {
                    reject(error);
                }
            });
        });
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


    // Display popup on click
    function disposePopover() {
        if (popover) {
            popover.dispose();
            popover = undefined;
        }
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

            const titleElement = document.createElement('div');
            isInFavorites(feature).then(isFavorite => {

                const imgElement = document.createElement('img');
                imgElement.src = 'static/img/comment.png';
                imgElement.width = '22';
                imgElement.height = '22';
                imgElement.style.position = 'absolute';
                imgElement.style.top = '1px';
                imgElement.style.right = '65px';

                const favoriteMarker = isFavorite ? '<span class="favorite-marker-dash">-</span>' :
                    '<span class="favorite-marker-star">★</span>';
                titleElement.innerHTML = '<span class="favorite-marker" style="cursor: pointer;">' + favoriteMarker +
                    '</span>' + imgElement.outerHTML + '<a class="ol-popup-closer" href="#"></a>';

                popover = new bootstrap.Popover(element, {
                    placement: 'top',
                    html: true,
                    title: titleElement,
                    content: feature.get('name'),
                });
                popover.show();

                selectedMarker = feature;

                const commentIcon = titleElement.querySelector('img[src="static/img/comment.png"]');
                if (commentIcon) {
                    commentIcon.addEventListener('click', function () {
                        const commentModal = new bootstrap.Modal(document.getElementById('commentModal'));
                        commentModal.show();
                        popover.hide();
                        fetchComments(feature);
                    });
                }
            }).catch(error => {
                console.error("Error checking favorites:", error);
            });
        });

        document.getElementById('confirmAddComment').addEventListener('click', function() {
            const checkedStars = document.querySelectorAll('input[name="commentRating"]:checked');
            let rating = 0;
            for (let i = 0; i < checkedStars.length; i++) {
                rating = checkedStars[i].value;
            }

            const comment = document.getElementById('newComment').value;
            sendCommentToServer(selectedMarker, comment, rating);

        });

        document.addEventListener('click', function (event) {
            if (event.target.classList.contains('favorite-marker-dash')) {
                if (!isInFavorites(selectedMarker)) {
                    addToFavorites(selectedMarker);
                } else {
                    removeFromFavorites(selectedMarker);
                }
            } else if (event.target.classList.contains('favorite-marker-star')) {
                if (isInFavorites(selectedMarker)) {
                    addToFavorites(selectedMarker);
                }
            } else{
                let closer = event.target.closest('.ol-popup-closer');
                if (closer) {
                    popover.hide();
                }
            }
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

    /** Sends an AJAX request to add the current feature to the user's favorites.
     * Updates the UI accordingly upon success.
     * @param {Object} feature - The feature object to be added to favorites. */
    function addToFavorites(feature) {
        $.ajax({
            url: 'api/add_to_favorites',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(feature),

            success: function (response) {
                console.log('Added gas station to favorite list', response);

                // Update UI
                const favoriteMarker = document.querySelector('.favorite-marker');
                if (favoriteMarker) {
                    favoriteMarker.innerHTML = '-';
                    favoriteMarker.classList.remove('favorite-marker-star');
                    favoriteMarker.classList.add('favorite-marker-dash');
                }
            },
            error: function (error) {
                console.error("Added failed:", error);
            }
        });
    }

    /** Sends an AJAX request to check if the provided feature is in the user's favorites.
     * @param {Object} feature - The feature object to be checked.
     * @returns {Promise<boolean>} - A promise resolving to true if the feature is in favorites, false otherwise. */
    function isInFavorites(feature) {
        const stationId = feature.get('id');
        return new Promise((resolve, reject) => {
            $.ajax({
                url: '/api/check_favorite',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ stationId: stationId }),
                success: function (response) {
                    resolve(response.isFavorite);
                },
                error: function (error) {
                    console.error("Error checking favorites:", error);
                    reject(error);
                }
            });
        });
    }

    /** Sends an AJAX request to remove the provided feature from the user's favorites.
     * Updates the UI accordingly upon success.
     * @param {Object} feature - The feature object to be removed from favorites. */
    function removeFromFavorites(feature) {
        const stationId = feature.get('id');
        $.ajax({
            url: '/api/remove_from_favorites',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ stationId: stationId }),
            success: function (response) {
                console.log('Removed gas station from favorites:', response);
                gasStationsMarkersLayers["Favorites"].getSource().getFeatures().forEach(function (feat) {
                if (feat.get('id') === stationId) {
                    gasStationsMarkersLayers["Favorites"].getSource().removeFeature(feat);
                }
                });

                // Update UI
                const favoriteMarker = document.querySelector('.favorite-marker-dash');
                if (favoriteMarker) {
                    favoriteMarker.innerHTML = '★';
                    favoriteMarker.classList.remove('favorite-marker-dash');
                    favoriteMarker.classList.add('favorite-marker-star');
                }
            },
            error: function (error) {
                console.error("Error removing from favorites:", error);
            }
        });
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    function sendCommentToServer(feature, comment, rating) {
        const stationId = feature.get('id');
        const username = getCookie('username');

        if (!username) {
            console.error('Username not found in cookies.');
            return;
        }

         $.ajax({
            url: '/api/add_review',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                stationId: stationId,
                comment: comment,
                rating: rating
            }),
            success: function(response) {
                const commentList = $('.comment-list');
                const listItem = $('<li class="list-group-item"></li>');

                // Create the image element
                const imgElement = document.createElement('img');
                imgElement.src = 'static/img/user.png';
                imgElement.width = '22';
                imgElement.height = '22';
                imgElement.style.marginRight = '10px';

                // Create the username element and container
                const usernameContainer = $('<div class="username-container"></div>').css({
                    display: 'flex',
                    alignItems: 'center'
                });
                const usernameElement = $('<span class="username"></span>').text(username);
                usernameContainer.append(imgElement).append(usernameElement);

                const ratings = $('<div class="rating"></div>');
                const ratingValue = parseInt(rating);
                for (let i = 1; i <= ratingValue; i++) {
                    ratings.append('<span class="star">&#9733;</span>');
                }
                for (let i = ratingValue + 1; i <= 5; i++) {
                    ratings.append('<span class="star">&#9734;</span>');
                }

                const commentContent = $('<div class="comment-content"></div>').text(comment);

                listItem.append(usernameContainer);
                listItem.append(ratings);
                listItem.append(commentContent);
                commentList.append(listItem);
            },
            error: function(xhr, status, error) {
                console.error('Error sending comment:', error);
            }
        });
    }


    function extractValue(inputString, keyword) {
        let startIndex = inputString.indexOf(keyword);
        if (startIndex !== -1) {
            startIndex += keyword.length;
            let endIndex = inputString.indexOf('<', startIndex);
            return endIndex !== -1 ? inputString.substring(startIndex, endIndex).trim() : "undefined";
        }
        return "undefined";
    }

    function fetchComments(feature) {
        const stationId = feature.get('id');
        $.ajax({
            url: `/api/get_review/${stationId}/`,
            type: 'GET',
            success: function(response) {
                displayComments(response);
            },
            error: function(xhr, status, error) {
                console.error('Error during fetching comments:', error);
            }
        });
    }

    function displayComments(commentsJson) {
        const commentList = $('.comment-list');
        commentList.empty();

        try {
            const comments = JSON.parse(commentsJson);

            comments.forEach(function(comment) {
                const listItem = $('<li class="list-group-item"></li>');

                const imgElement = document.createElement('img');
                imgElement.src = 'static/img/user.png';
                imgElement.width = '22';
                imgElement.height = '22';
                imgElement.style.marginRight = '10px';

                // Create the username element and container
                const usernameContainer = $('<div class="username-container"></div>').css({
                    display: 'flex',
                    alignItems: 'center'
                });
                const username = $('<span class="username"></span>').text(comment.username);

                // Append the image and username to the container
                usernameContainer.append(imgElement);
                usernameContainer.append(username);

                const rating = $('<div class="rating"></div>');
                const ratingValue = parseInt(comment.rating);
                for (let i = 1; i <= ratingValue; i++) {
                    rating.append('<span class="star">&#9733;</span>'); // filled star
                }
                for (let i = ratingValue + 1; i <= 5; i++) {
                    rating.append('<span class="star">&#9734;</span>'); // empty star
                }

                // Create the comment content element
                const commentContent = $('<div class="comment-content"></div>').text(comment.comment);

                // Append elements to the list item
                listItem.append(usernameContainer);
                listItem.append(rating);
                listItem.append(commentContent);

                // Append the list item to the comment list
                commentList.append(listItem);
            });
        } catch (error) {
            console.error('Error during fetching comments: ', error);
        }
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

    /* Listens for the modal hide event to perform cleanup when the "Cancel" button is clicked.
     * It clears the userMarkerLayer, resets userMarkerCoords, and updates UI elements.*/
    $('#addMarkerModal').on('hide.bs.modal', function () {
        userMarkerLayer.getSource().clear();
        userMarkerCoords = null;
        $(".add-marker").text('Cancel');
    });

    /*Listens if add new station marker button has been clicked and after that user has possibility to add new marker
    * on the map.*/
    $('#addNewStationMarker').on('click', function() {
        console.log('Add new Marker button clicked!');
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

            const user_marked_lonlat = event.feature.getGeometry().clone().transform('EPSG:3857', defaultProjection);
            userMarkerCoords = user_marked_lonlat.getCoordinates();
            console.log('User marker coords: (', userMarkerCoords[0], ',', userMarkerCoords[1], ')');

            $('#addMarkerModal').modal('show');
        });
    });

    $('#confirmAddMarker').on('click', function() {
        let Name = $('#Name').val();
        let Brand = $('#Brand').val();
        let Diesel = $('#Diesel').val();
        let LPG = $('#LPG').val();
        let Octane95 = $('#octane95').val();
        let Octane98 = $('#octane98').val();
        let OpeningHours = $('#openingHours').val();

        let data = {
            lon: userMarkerCoords[0].toFixed(7),
            lat: userMarkerCoords[1].toFixed(7),
            name: Name,
            brand: Brand,
            "fuel:diesel": Diesel,
            "fuel:lpg": LPG,
            "fuel:octane_95": Octane95,
            "fuel:octane_98": Octane98,
            opening_hours: OpeningHours,
        }
        $.ajax({
            url: 'api/add_marker',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),

            success: function(response) {
                selectedMarker = null;
                console.log("Update successful:", response);
            },
            error: function(error) {
                console.error("Update failed:", error);
            }
        });

        $('#addMarkerModal').modal('hide');
        location.reload();
    });

    /*Listens if edit station marker button has been clicked and after that user has possibility to select gas station
    * marker to edit.*/
    $('#editStationMarker').on('click', function() {

        let existingData = {
                name: selectedMarker.get('name'),
            };
        disposePopover();
        let extractedName = extractValue(existingData.name, "Name:");
        let extractedBrand = extractValue(existingData.name, "Brand:");
        let extractedDiesel = extractValue(existingData.name, "Diesel:");
        let extractedLPG = extractValue(existingData.name, "LPG:");
        let extractedOctane95 = extractValue(existingData.name, "Octane 95:");
        let extractedOctane98 = extractValue(existingData.name, "Octane 98:");
        let extractedOpeningHours = extractValue(existingData.name, "Opening hours:");


        // Pre-fill input fields with existing data
        $('#newName').val(extractedName);
        $('#newBrand').val(extractedBrand);
        $('#newDiesel').val(extractedDiesel);
        $('#newLPG').val(extractedLPG);
        $('#newOctane95').val(extractedOctane95);
        $('#newOctane98').val(extractedOctane98);
        $('#newOpeningHours').val(extractedOpeningHours);

        $('#editMarkerModal').modal('show');
    });

    $('#confirmEdit').on('click', function() {
        console.log("Edited selected marker!")

        if (selectedMarker) {

            let newName = $('#newName').val();
            let newBrand = $('#newBrand').val();
            let newDiesel = $('#newDiesel').val();
            let newLPG = $('#newLPG').val();
            let newOctane95 = $('#newOctane95').val();
            let newOctane98 = $('#newOctane98').val();
            let newOpeningHours = $('#newOpeningHours').val();

            let updateData = {
                _id: selectedMarker.get('id'),
                name: newName,
                brand: newBrand,
                "fuel:diesel": newDiesel,
                "fuel:lpg": newLPG,
                "fuel:octane_95": newOctane95,
                "fuel:octane_98": newOctane98,
                opening_hours: newOpeningHours,
            }
            $.ajax({
                url: 'api/update_data_marker',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(updateData),

                success: function(response) {
                    selectedMarker = null;
                    console.log("Update successful:", response);
                },
                error: function(error) {
                    console.error("Update failed:", error);
                }
            })
        }
        else {
            showAlert('No marker selected to edit', 'warning');
        }
        $('#editMarkerModal').modal('hide');
        location.reload();
        showAlert(`Successfully edited marker with coords: (${userMarkerCoords[0]}, ${userMarkerCoords[1]})`, 'success');
    });


    /*Listens if remove station marker button has been clicked and after that user has possibility to select gas station
    * marker to remove.*/
    $('#removeStationMarker').on('click', function() {
        disposePopover();
        $('#removeMarkerModal').modal('show');
    });

    /*Listens if remove button in remove modal has been clicked and removing selected marker on the map and in database*/
    $('#confirmRemove').on('click', function() {
        console.log('Removing marker....');
        if (selectedMarker) {
            // Make request to delete the marker from the backend
            $.ajax({
                url: '/api/remove_marker',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ _id: selectedMarker.get('id')}),
                success: function (response) {
                    // Find and remove the marker from the map from gas stations markers layers
                    const markerId = selectedMarker.get('id');

                    for (let key in gasStationsMarkersLayers) {
                        const layerSource = gasStationsMarkersLayers[key].getSource();
                        const features = layerSource.getFeatures();

                        const featureToRemove = features.find(feature => feature.get('id') === markerId);
                        if (featureToRemove) {
                            layerSource.removeFeature(featureToRemove);
                        }
                    }

                    console.log('Marker removed from the database:', response);
                    selectedMarker = null;
                    showAlert('Marker removed successfully', 'success');
                },
                error: function (error) {
                    // Handle error response from the backend
                    console.error('Error removing marker from the database:', error);
                    showAlert('Error removing marker from the database', 'danger');
                }
            });
        } else {
            showAlert('No marker selected to remove', 'warning');
        }
        $('#removeMarkerModal').modal('hide');
    });

    /*Function handles the click event on the logout button.*/
    $('#log-out').click(function() {
        $.ajax({
            url: '/logout',
            type: 'POST',
            success: function(response) {
                console.log('User logged out:', response);
                window.location.href = '/login';
            },
            error: function(error) {
                console.error('Error logging out:', error);
            }
        });
    });

    init();
});