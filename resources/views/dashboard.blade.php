<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Peta Monitoring GIS') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6 text-gray-900">

                    <div class="mb-4">
                        {{ __("Berikut adalah tampilan peta lokasi indikator telepon.") }}
                    </div>

                    {{-- Kontainer Peta --}}
                    <div id="map" class="w-full h-96 rounded-md shadow"></div>

                </div>
            </div>
        </div>
    </div>

    {{-- Inisialisasi Peta --}}
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            var map = L.map('map').setView([-8.173358, 112.684885], 17); // Fokus ke Turen

            // Tile Real View
            L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=YOUR_API_KEY', {
    maxZoom: 20,
    attribution: 'Map data © Google'
}).addTo(map);


            // Marker Lokasi Telepon
            L.marker([-8.173358, 112.684885]).addTo(map)
                .bindPopup('Indikator Telepon nyala')
                .openPopup();

            // Video Overlay di Area Turen
            var videoUrls = [
                'https://www.mapbox.com/bites/00188/patricia_nasa.webm',
                'https://www.mapbox.com/bites/00188/patricia_nasa.mp4'
            ];
            var errorOverlayUrl = 'https://cdn-icons-png.flaticon.com/512/110/110686.png';

            // Atur area bounds di sekitar Turen
            var latLngBounds = L.latLngBounds([
                [-8.172, 112.683],
                [-8.175, 112.687]
            ]);

            var videoOverlay = L.videoOverlay(videoUrls, latLngBounds, {
                opacity: 0.8,
                errorOverlayUrl: errorOverlayUrl,
                interactive: true,
                autoplay: true,
                muted: true,
                playsInline: true
            }).addTo(map);

            videoOverlay.getElement().pause();

            videoOverlay.on('load', function () {
                var MyPauseControl = L.Control.extend({
                    onAdd: function () {
                        var button = L.DomUtil.create('button', 'bg-white p-2 rounded shadow');
                        button.title = 'Pause';
                        button.innerHTML = '⏸';
                        L.DomEvent.on(button, 'click', function () {
                            videoOverlay.getElement().pause();
                        });
                        return button;
                    }
                });

                var MyPlayControl = L.Control.extend({
                    onAdd: function () {
                        var button = L.DomUtil.create('button', 'bg-white p-2 rounded shadow');
                        button.title = 'Play';
                        button.innerHTML = '▶️';
                        L.DomEvent.on(button, 'click', function () {
                            videoOverlay.getElement().play();
                        });
                        return button;
                    }
                });

                (new MyPauseControl({ position: 'topleft' })).addTo(map);
                (new MyPlayControl({ position: 'topleft' })).addTo(map);
            });
        });
    </script>
</x-app-layout>
