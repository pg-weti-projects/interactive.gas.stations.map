/*Create layers styles for map*/
export function createMapLayers(mapLayersStyles){
    let bingApiKey = "ApTJzdkyN1DdFKkRAE6QIDtzihNaf6IWJsT-nQ_2eMoO4PN__0Tzhl2-WgJtXFSp";
    let layers = [];

    let osmLayer = new ol.layer.Tile({
        source: new ol.source.OSM(),
        title: 'OSM Map',
    })
    layers.push(osmLayer);

    for (let layerName in mapLayersStyles) {
        if (layerName === 'OSMLayer') {
            continue;
        }
        let layerSource = new ol.source.BingMaps({
            key: bingApiKey,
            imagerySet: layerName,
        });
        let layerTile = new ol.layer.Tile({
            visible: false,
            preload: Infinity,
            source: layerSource
        })
        layers.push(layerTile)
    }
    return layers;
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