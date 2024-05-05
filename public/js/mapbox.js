/* eslint-disable */
// This file has been appended in the tour.pug template

export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic2hpdmFtc2FobmkxMTIyIiwiYSI6ImNsczVmbnpkMTFnazEybXJ3NHJmbGF1bzEifQ.TpT3DbzaJaht6sMdoP6lZg';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/shivamsahni1122/cls5fvmdt015501pl5bxoeck5',
    scrollZoom: false

    // center: [-118.030031, 34.4364],
    //   zoom: 10,
    //   interactive: false
  });

  // This is basically the area that will be
  // displayed on the map

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
