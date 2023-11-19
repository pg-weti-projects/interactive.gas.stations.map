/*Create main map layer with OSM source*/
export function createOsmLayer(){
    return new ol.layer.Tile({
        source: new ol.source.OSM(),
        title: 'OSM Map',
    })
}


/*Create layer to draw route on the map between two points*/
export function createRouteLayer(routeStrokeStyle) {
    return new ol.layer.Vector({
        style: new ol.style.Style({
            stroke: new ol.style.Stroke(routeStrokeStyle)
        })
    });
}

/*Create layer to put user marker on the map*/
export function createUserMarkerLayer(userMarkerScale, userMarkerAnchor) {
    return new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: new ol.style.Style({
            image: new ol.style.Icon({
                src: 'static/img/user_marker.png',
                scale: userMarkerScale,
                anchor: userMarkerAnchor,
            }),
        }),
    });
}


/*Create layers for each station type and return dict with it where key is the name/brand station*/
export function createGasStationsMarkersLayers(gasStationsMarkersLayers) {
    for (let layer in gasStationsMarkersLayers) {
        if (gasStationsMarkersLayers.hasOwnProperty(layer)) {
            gasStationsMarkersLayers[layer] = new ol.layer.Vector();
        }
    }
    return gasStationsMarkersLayers;
}