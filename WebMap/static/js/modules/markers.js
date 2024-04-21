/*Create dictionary with lists of all stations markers ( Feature objects )*/
export function generateFeaturesMarkersEachStation(markersScale, markersAnchor)
{
    let markersFeatures = {'Orlen': [], 'BP': [], 'Lotos': [], 'Circle K': [], 'Amic': [], 'Moya': [], 'Shell': [], 'MOL': [], 'Other': []};
    return new Promise((resolve, reject) => {
        fetch('/api/gas_station_data')
        .then(response => response.json())
        .then(data => {
            let result = groupStationsByBrand(data, markersScale, markersAnchor, markersFeatures, true);
            Promise.all(result['promises'])
                .then(() => {
                    resolve(result['markersFeatures']);
                })
                .catch(error => {
                    console.error('An error occured during adding gas stations markers:', error);
                    reject(error);
                });
        })
        .catch(error => {
            console.error('Error during download data from API:', error);
            reject(error);
        });
    });
}

/*Groups passed to function gas stations data by brand*/
export function groupStationsByBrand(data, markersScale, markersAnchor, markersFeatures, promisesEnabled)
{
    const promises = []
    data.forEach(station => {
        const promise = new Promise((resolve, reject) => {
            let _id = station._id;
            let lon = station.lon;
            let lat = station.lat;
            let name = station.name;
            let brand = station.brand;
            let diesel = station['fuel:diesel'];
            let lpg = station['fuel:lpg'];
            let octane_95 = station['fuel:octane_95'];
            let octane_98 = station['fuel:octane_98'];
            let opening_hours = station.opening_hours;
            let station_lonlat_obj = ol.proj.fromLonLat([lon, lat]);
            let markerStyle;

            let marker = new ol.Feature({
                id: _id,
                geometry: new ol.geom.Point(station_lonlat_obj),
                name: `<b>Name: ${name}</b><br><b>Brand: ${brand}</b><br><b>Longitude: ${lon}</b><br><b>Latitude: ${lat}</b><br><b>Diesel: ${diesel}</b><br><b>LPG: ${lpg}</b><br><b>Octane 95: ${octane_95}</b><br><b>Octane 98: ${octane_98}</b><br><b>Opening hours: ${opening_hours}</b>`
            });

            if (name === 'Circle K' || brand === 'Circle K') {
                markerStyle = new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'static/img/gas_station_point_circle_k.png',
                        scale: markersScale,
                        anchor: markersAnchor,
                    })
                });
            } else if (name === 'BP' || brand === 'BP') {
                markerStyle = new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'static/img/gas_station_point_bp.png',
                        scale: markersScale,
                        anchor: markersAnchor,
                    })
                });
            } else if (name === 'Moya' || brand === 'Moya') {
            markerStyle = new ol.style.Style({
                image: new ol.style.Icon({
                    src: 'static/img/gas_station_point_moya.png',
                    scale: markersScale,
                    anchor: markersAnchor,
                })
            });
            } else if (name === 'Lotos' || brand === 'Lotos') {
                markerStyle = new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'static/img/gas_station_point_lotos.png',
                        scale: markersScale,
                        anchor: markersAnchor,
                    })
                });
            } else if (name === 'Amic' || brand === 'Amic') {
                markerStyle = new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'static/img/gas_station_point_amica.png',
                        scale: markersScale,
                        anchor: markersAnchor,
                    })
                });
            } else if (name === 'Shell' || brand === 'Shell') {
                markerStyle = new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'static/img/gas_station_point_shell.png',
                        scale: markersScale,
                        anchor: markersAnchor,
                    })
                });
            } else if(name === 'Orlen' || brand === 'Orlen') {
                markerStyle = new ol.style.Style({
                    image: new ol.style.Icon({
                        src: '/static/img/gas_station_point_orlen.png',
                        scale: markersScale,
                        anchor: markersAnchor,
                    })
                });
            } else if(name === 'MOL' || brand === 'MOL') {
                markerStyle = new ol.style.Style({
                    image: new ol.style.Icon({
                        src: '/static/img/gas_station_point_mol.png',
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

            marker.setStyle(markerStyle);

            if ("Favorites" in markersFeatures)
            {
                markersFeatures["Favorites"].push(marker);
            } else {
                if (name in markersFeatures)
                {
                    markersFeatures[name].push(marker);
                } else if (brand in markersFeatures) {
                    markersFeatures[brand].push(marker);
                } else {
                    markersFeatures['Other'].push(marker);
                }
            }
            if (promisesEnabled) {
                resolve();
            }
        });

        if (promisesEnabled) {
            promises.push(promise);
        }
    });

    return {"markersFeatures": markersFeatures, "promises": promises};
}