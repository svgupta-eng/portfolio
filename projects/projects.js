import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json'); 
const projectsContainer = document.querySelector('.projects'); 

const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle) {
  projectsTitle.textContent = `${projects.length} Projects`;
}

let query = '';
let searchInput = document.querySelector('.searchBar');
let selectedYear = ''; 

function filterAndRender() {
  let filteredBySearch = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query);
  });

  let fullyFiltered = filteredBySearch;
  if (selectedYear) {
    fullyFiltered = filteredBySearch.filter((project) => project.year === selectedYear);
  }

  renderProjects(fullyFiltered, projectsContainer, 'h2');
  renderPieChart(filteredBySearch);
}

function renderPieChart(projectsGiven) {
  let newSVG = d3.select('svg');
  newSVG.selectAll('path').remove();
  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let arcs = newArcData.map((d) => arcGenerator(d));
  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  let selectedIndex = newData.findIndex((d) => d.label === selectedYear);

  arcs.forEach((arc, i) => {
    newSVG
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .attr('class', i === selectedIndex ? 'selected' : '')
      .on('click', () => {
        selectedYear = selectedYear === newData[i].label ? '' : newData[i].label;
        filterAndRender();
      });
  });

  newData.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', idx === selectedIndex ? 'selected' : '')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

filterAndRender();

if (searchInput) {
  searchInput.addEventListener('change', (event) => {
    query = event.target.value.toLowerCase();
    filterAndRender();
  });
}