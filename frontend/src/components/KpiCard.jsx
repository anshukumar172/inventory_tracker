import { Card, CardContent, Typography } from "@mui/material";

const KpiCard = ({ title, value }) => (
  <Card>
    <CardContent>
      <Typography variant="subtitle2">{title}</Typography>
      <Typography variant="h4">{value}</Typography>
    </CardContent>
  </Card>
);

export default KpiCard;
