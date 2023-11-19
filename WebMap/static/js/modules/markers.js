/*Create markers based on information from MongoDB */
export function generateAllMarkers(markersScale, markersAnchor) {
    return new Promise((resolve, reject) => {
        let features = [];
        fetch('/api/gas_station_data')
        .then(response => response.json())
        .then(data => {
            const promises = [];

            data.forEach(station => {
                const promise = new Promise((resolve, reject) => {
                let lon = station.lon;
                let lat = station.lat;
                let name = station.name;
                let brand = station.brand;
                let station_lonlat_obj = ol.proj.fromLonLat([lon, lat]);
                let markerStyle;

                if (name === 'Orlen' || brand === 'Orlen') {
                    markerStyle = new ol.style.Style({
                        image: new ol.style.Icon({
                            src: '/static/img/gas_station_point_orlen.png',
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
                } else if (name === 'Lotos' || brand === 'Lotos') {
                    markerStyle = new ol.style.Style({
                        image: new ol.style.Icon({
                            src: 'static/img/gas_station_point_lotos.png',
                            scale: markersScale,
                            anchor: markersAnchor,
                        })
                    });
                } else if (name === 'Circle K' || brand === 'Circle K') {
                    markerStyle = new ol.style.Style({
                        image: new ol.style.Icon({
                            src: 'static/img/gas_station_point_circle_k.png',
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
                } else if (name === 'Moya' || brand === 'Moya') {
                    markerStyle = new ol.style.Style({
                        image: new ol.style.Icon({
                            src: 'static/img/gas_station_point_moya.png',
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
                        geometry: new ol.geom.Point(station_lonlat_obj),
                        name: `<b>Name: ${name}</b><br><b>Brand: ${brand}</b><br><b>Longitude: ${lon}</b><br><b>Latitude: ${lat}</b>`
                    });
                    marker.setStyle(markerStyle);

                    features.push(marker);

                    resolve();
                });
                promises.push(promise);
            });

            Promise.all(promises)
                .then(() => {
                    resolve(features);
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