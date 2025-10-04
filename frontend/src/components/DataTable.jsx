import { DataGrid } from "@mui/x-data-grid";
import { Box } from "@mui/material";

const DataTable = ({ rows, columns }) => (
  <Box sx={{ height: 400, width: "100%" }}>
    <DataGrid
      rows={rows}
      columns={columns}
      pageSize={10}
      rowsPerPageOptions={[10]}
      autoHeight
      disableSelectionOnClick
    />
  </Box>
);

export default DataTable;
