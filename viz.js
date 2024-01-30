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
    const info = `<b>${props?.ADMIN}</b><br/>${Number(props?.myfeature).toFixed(3)}`
    this._div.innerHTML = title + (props ? info : instructions)
}

info.addTo(map)

function csvToJson(csv){
    const jsmap = {}
    for (const row of csv.split('\n')) {
        const [country_name, year, target] = row.split(',')
        
        if (!(year in jsmap)) jsmap[year] = {}
    
        jsmap[year][country_name] = target
    }
    return jsmap
}

const colorScale = [
    "#FFEDA0",
    "#FED976",
    "#FEB24C",
    "#FD8D3C",
    "#FC4E2A",
    "#E31A1C",
    "#BD0026",
    "#800026"
]

function getColor_discrete(d) {
    const color = colorScale[Math.ceil(d * colorScale.length) - 1]
    return color || '#111'
}

const maxSaturation = 255
function getColor_cont(d) {
    const blue = maxSaturation * d
    const red = maxSaturation - blue
    return `rgb(${red},${blue / 3},${blue})`
}

getColor = getColor_discrete

function style(feature) {
    return {
        fillColor: getColor(feature.properties.myfeature),
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    }
}

function fillvalues(geojson, year, mapYearCountryValue) {
    const thisEra = mapYearCountryValue[year]
    for (const country of geojson.features) {
        country.properties.myfeature = thisEra[country.properties.ADMIN]
    }
}

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

async function doViz(mapYearCountryValue, defaultYear) {
    await setWorldGeoJson()
    fillvalues(worldGeoJson, defaultYear, mapYearCountryValue)

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
        fillvalues(worldGeoJson, this.value, mapYearCountryValue)
        geoJsonMap.removeFrom(map)
        geoJsonMap = L.geoJson(worldGeoJson, { style, onEachFeature, }).addTo(map)

        document.getElementById('year').innerHTML = this.value
    })
}