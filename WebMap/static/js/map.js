$(document).ready(function () {

    var lon = 18.64542;
    var lat = 54.34766;
    var zoom = 5;
    var map;
    var mercator = new OpenLayers.Projection("EPSG:900913");
    var wgs84 = new OpenLayers.Projection("EPSG:4326");
    var apiKey = "ApTJzdkyN1DdFKkRAE6QIDtzihNaf6IWJsT-nQ_2eMoO4PN__0Tzhl2-WgJtXFSp";
    var options = { projection: mercator };


    function init(){
        map = new OpenLayers.Map('map', options);

        var osm = new OpenLayers.Layer.OSM("Simple OSM Map");

        map.addLayers([osm]);
        map.zoomIn();
    }

    init();
});