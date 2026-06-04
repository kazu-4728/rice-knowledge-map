import { pointColor, type FieldArea, type MapPoint } from "../../lib/map/sampleMapData";

function pinSvg(color: string, alert = false) {
  return `
    <svg class="map-marker__pin" viewBox="0 0 30 36" aria-hidden="true">
      <path d="M15 2C8.8 2 4 6.8 4 13c0 8.3 11 21 11 21s11-12.7 11-21C26 6.8 21.2 2 15 2Z" fill="${color}" stroke="white" stroke-width="2"/>
      ${alert ? '<path d="M15 8v10M15 23v1" stroke="white" stroke-linecap="round" stroke-width="3.2"/>' : '<circle cx="15" cy="13" r="4" fill="white"/>'}
    </svg>
  `;
}

export function createPointMarker(point: MapPoint) {
  const element = document.createElement("div");
  element.className = "map-marker";
  element.innerHTML = `${pinSvg(pointColor(point.kind), point.kind === "alert")}<span class="map-marker__label">${point.label}</span>`;
  return element;
}

export function createFieldLabel(field: FieldArea) {
  const element = document.createElement("div");
  element.className = "map-field-label";
  element.textContent = field.name;
  return element;
}
