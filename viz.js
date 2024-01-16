function getColor(d) {
    return d > 0.9 ? '#800026' :
        d > 0.8 ? '#BD0026' :
            d > 0.7 ? '#E31A1C' :
                d > 0.6 ? '#FC4E2A' :
                    d > 0.5 ? '#FD8D3C' :
                        d > 0.4 ? '#FEB24C' :
                            d > 0.3 ? '#FED976' :
                                d > 0 ? '#FFEDA0' :
                                    '#111'
}

function style(feature) {
    return {
        fillColor: getColor(feature.properties.w4),
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    }
}

function fillw4(geojson, year) {
    const thisw4 = w4[year]
    for (const country of geojson.features) {
        country.properties.w4 = thisw4[country.properties.ADMIN]
    }
}

let worldGeoJson
async function setWorldGeoJson() {
    if (worldGeoJson) return
    const r = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
    worldGeoJson = await r.json()
}


let map = L.map('map').setView([0, 0], 2)
/* L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map) */

var info = L.control()

info.onAdd = function () {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update()
    return this._div
}

info.update = function (props) {
    const title = '<h4>Coalition Index</h4>'
    const instructions = 'Hover over a country'
    const info = `<b>${props?.ADMIN}</b><br/>${Number(props?.w4).toFixed(3)}`
    this._div.innerHTML = title + (props ? info : instructions)
}

info.addTo(map)

function highlightFeature(e) {
    var layer = e.target
    layer.setStyle({
        weight: 3.5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    })
    layer.bringToFront()
    info.update(layer.feature.properties)
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds())
}


async function doViz() {
    await setWorldGeoJson()
    fillw4(worldGeoJson, 2015)

    function resetHighlight(e) {
        geoJsonMap.resetStyle(e.target)
        info.update()
    }

    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: zoomToFeature,
        })
    }

    geoJsonMap = L.geoJson(worldGeoJson, { style, onEachFeature, }).addTo(map)

    document.getElementById('slider').addEventListener('change', function () {
        console.log('year', this.value)

        fillw4(worldGeoJson, this.value)
        geoJsonMap.removeFrom(map)
        geoJsonMap = L.geoJson(worldGeoJson, { style, onEachFeature, }).addTo(map)

        document.getElementById('year').innerHTML = this.value
    })
}

doViz()