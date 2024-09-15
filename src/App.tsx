import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Paginator } from 'primereact/paginator';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import drop from './assets/down-arrow (1).png'
import "primereact/resources/themes/md-light-deeppurple/theme.css";


interface Artwork {
  id: number;
  title: string;
  place_of_origin: string | null;
  artist_display: string | null;
  inscriptions: string | null;
  date_start: number;
  date_end: number;
}

interface Pagination {
  total_pages: number;
  current_page: number;
}

interface ApiResponse {
  data: Artwork[];
  pagination: Pagination;
}

const App: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]); // State for artworks
  const [selectedArtworks, setSelectedArtworks] = useState<Artwork[]>([]); // State for selected rows
  const [page, setPage] = useState<number>(1); // Current page state
  const [totalRecords, setTotalRecords] = useState<number>(0); // Total number of records
  const [inputValue, setInputValue] = useState<string>(''); // Input value for number of selections
  const rowsPerPage = 12; // Number of rows per page
  const [loading, setLoading] = useState<boolean>(false);

  const overlayPanelRef = useRef<OverlayPanel>(null); // Reference for the overlay panel

  const fetchArtworks = async (pageNumber: number) => {
    try {
      const response = await axios.get<ApiResponse>(`https://api.artic.edu/api/v1/artworks?page=${pageNumber}`);
      const data = response.data;
      setArtworks(data.data); // Store the artworks data
      setTotalRecords(data.pagination.total_pages * rowsPerPage); // Set total records
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchArtworks(page);
  }, [page]);

  // Function to handle page change
  const onPageChange = (event: { first: number; rows: number; page?: number }) => {
    setPage((event.page || 0) + 1);
  };


  // Fetch artworks from a specific page (used when fetching multiple pages)
  const fetchArtworksForSelection = async (pageNumber: number) => {
    try {
      const response = await axios.get<ApiResponse>(`https://api.artic.edu/api/v1/artworks?page=${pageNumber}`);
      return response.data.data; // Return the artworks data from that page
    } catch (error) {
      console.error("Error fetching data:", error);
      return [];
    }
  };

  // Function to handle input submission for row selection
  const handleSelectRows = async () => {
    const selectedRowCount = parseInt(inputValue);
    if (!isNaN(selectedRowCount) && selectedRowCount > 0) {
      let rowsToSelect: Artwork[] = [];

      // If the number to select exceeds the rows per page, fetch from multiple pages
      let currentPage = page;
      let remainingRows = selectedRowCount;

      while (remainingRows > 0) {
        // Fetch artworks from the current page
        const artworksToFetch = await fetchArtworksForSelection(currentPage);

        // Calculate how many rows we can take from the current page
        const rowsFromCurrentPage = Math.min(remainingRows, artworksToFetch.length);

        // Add the artworks to select from this page
        rowsToSelect = [...rowsToSelect, ...artworksToFetch.slice(0, rowsFromCurrentPage)];

        // Update remaining rows to select
        remainingRows -= rowsFromCurrentPage;

        // Move to the next page
        currentPage++;
      }

      // Merge the existing selected rows with the new ones (avoiding duplicates)
      const updatedSelection = [...new Set([...selectedArtworks, ...rowsToSelect])];
      setSelectedArtworks(updatedSelection); // Update selected artworks
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', alignItems: 'center', padding: '20px', backgroundColor: 'gray' }}>
      <span style={{ fontSize: '52px', fontWeight: 'bolder', color: 'white', }}>ARTWORK</span>
      <div style={{ padding: '12px', borderRadius: '16px', backgroundColor: 'white', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)' }}>
        {loading ? ( // Show the spinner when loading is true
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <ProgressSpinner />
          </div>
        ) : (
          <DataTable
            value={artworks}
            paginator={true}
            rows={rowsPerPage}
            totalRecords={totalRecords}
            onPage={onPageChange}
            selection={selectedArtworks}
            onSelectionChange={(e) => setSelectedArtworks(e.value)}
            dataKey="id"
            responsiveLayout="scroll"
            selectionMode="checkbox"
          >
            <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>

            {/* Select All and the Popup Button in Header */}
            <Column
              header={
                <div className="p-d-flex p-jc-between"
                >
                  <img
                    src={drop}
                    style={{ width: '28px', cursor: 'pointer' }}
                    onClick={(e) => overlayPanelRef.current?.toggle(e)} // Opens the Overlay Panel on click
                  />
                  {/* Overlay Panel Popup */}
                  <OverlayPanel ref={overlayPanelRef}>
                    <div className="p-p-3">
                      <div className="p-inputgroup">
                        <InputText
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder="Enter number of rows"
                          type="number"
                        />
                        <Button
                          label="Submit"
                          onClick={() => {
                            handleSelectRows();
                            overlayPanelRef.current?.hide(); // Close the popup on submit
                          }}
                        />
                      </div>
                    </div>
                  </OverlayPanel>
                </div>
              }
              body={() => null} // Empty body as the functionality is in the header
            />

            <Column field="title" header="Title" sortable></Column>
            <Column field="place_of_origin" header="Place of Origin" sortable></Column>
            <Column field="artist_display" header="Artist" sortable></Column>
            <Column field="inscriptions" header="Inscriptions" sortable></Column>
            <Column field="date_start" header="Date Start" sortable></Column>
            <Column field="date_end" header="Date End" sortable></Column>
          </DataTable>
        )}
        < Paginator
          first={(page - 1) * rowsPerPage}
          rows={rowsPerPage}
          totalRecords={totalRecords}
          onPageChange={onPageChange}
        />
      </div>

    </div>
  );
};

export default App;
