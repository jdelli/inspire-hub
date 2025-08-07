"use client";
import { db } from "../../../../script/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore"; // Import 'query' here
import React, { useState, useEffect } from "react";
import { Monitor } from "lucide-react";
import seatMap1 from "../../(admin)/seatMap1.json";
import seatMap2 from "../../(admin)/seatMap2.json";
import seatMap3 from "../../(admin)/seatMap3.json";
import seatMap4 from "../../(admin)/seatMap4.json";
import seatMap5 from "../../(admin)/seatMap5.json";

import {
  Box,
  Typography,
  Stack,
  Paper,
  Divider,
  Chip,
  Card,
  CardContent,
  Tooltip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText
} from "@mui/material";
import { red, grey, blue, purple } from "@mui/material/colors";
import { Info as InfoIcon, MeetingRoom as MeetingRoomIcon } from '@mui/icons-material';

// Utility functions
function groupIntoPairs(entries) {
  const groups = [];
  for (let i = 0; i < entries.length; i += 2) {
    groups.push(entries.slice(i, i + 2));
  }
  return groups;
}

function groupSeatsByRow(seatMap) {
  return seatMap.reduce((acc, seat) => {
    const row = seat.number[0];
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {});
}

const groupedSeats1 = groupSeatsByRow(seatMap1);
const groupedSeats2 = groupSeatsByRow(seatMap2);
const groupedSeats3 = groupSeatsByRow(seatMap3);
const groupedSeats4 = groupSeatsByRow(seatMap4);
const groupedSeats5 = groupSeatsByRow(seatMap5);

const rowEntries1 = Object.entries(groupedSeats1).sort(([a], [b]) => a.localeCompare(b));
const rowEntries2 = Object.entries(groupedSeats2).sort(([a], [b]) => a.localeCompare(b));
const rowEntries3 = Object.entries(groupedSeats3).sort(([a], [b]) => a.localeCompare(b));
const rowEntries4 = Object.entries(groupedSeats4).sort(([a], [b]) => a.localeCompare(b));
const rowEntries5 = Object.entries(groupedSeats5).sort(([a], [b]) => a.localeCompare(b));

const groupPairs1 = groupIntoPairs(rowEntries1);
const groupPairs2 = groupIntoPairs(rowEntries2);
const groupPairs3 = groupIntoPairs(rowEntries3);
const groupPairs4 = groupIntoPairs(rowEntries4);
const groupPairs5 = groupIntoPairs(rowEntries5);

// Calculate total seats from all seat maps
const totalSeats = seatMap1.length + seatMap2.length + seatMap3.length + seatMap4.length + seatMap5.length;

export default function OccupiedSeatsMap() {
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [tabIndex, setTabIndex] = useState(0);

  // For private office data
  const [privateOfficeList, setPrivateOfficeList] = useState([]);
  const [occupiedPrivateOffices, setOccupiedPrivateOffices] = useState([]);

  useEffect(() => {
    if (tabIndex === 0) {
      async function fetchOccupiedSeats() {
        const querySnapshot = await getDocs(collection(db, "seatMap"));
        const allSelectedSeats = querySnapshot.docs.flatMap(doc =>
          doc.data().selectedSeats || []
        );
        setOccupiedSeats(allSelectedSeats);
        setLastUpdated(new Date().toLocaleString());
      }
      fetchOccupiedSeats();
    }
    if (tabIndex === 1) {
      async function fetchPrivateOffices() {
        // Corrected: Use 'query' and 'where' correctly
        const q = query(collection(db, "privateOffice"), where("status", "==", "active"));
        const querySnapshot = await getDocs(q);

        const officeDocs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setPrivateOfficeList(officeDocs);

        // Gather all selectedPOs (can be array or string)
        const allSelectedPO = [];
        officeDocs.forEach(office => {
          if (office.selectedPO) {
            if (Array.isArray(office.selectedPO)) {
              allSelectedPO.push(...office.selectedPO);
            } else {
              allSelectedPO.push(office.selectedPO);
            }
          }
        });
        setOccupiedPrivateOffices(allSelectedPO);
        setLastUpdated(new Date().toLocaleString());
      }
      fetchPrivateOffices();
    }
  }, [tabIndex]);

  const isSeatOccupied = (seat, mapType) => {
    const seatKey = `${mapType}-${seat.number}`;
    return occupiedSeats.includes(seatKey);
  };

  // Calculate remaining seats
  const remainingSeats = totalSeats - occupiedSeats.length;

  // Responsive seat width: minWidth for small screens, flex for stretching
  const responsiveSeatBoxSx = {
    minWidth: { xs: 28, sm: 36, md: 40 },
    width: { xs: "8vw", sm: "4vw", md: "40px" },
    maxWidth: { xs: 40, sm: 44, md: 50 },
    height: { xs: 20, sm: 22, md: 24 },
    p: 0,
    fontSize: { xs: '0.55rem', sm: '0.6rem' },
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0.5,
    transition: "all .15s"
  };

  // The map card itself should stretch with flex and minWidth, and be responsive
  const responsiveMapCardSx = {
    flexGrow: 1,
    minWidth: { xs: 250, sm: 320, md: 360 },
    maxWidth: { xs: "90vw", md: 420 },
    flexBasis: { xs: "90vw", sm: "auto" },
    flexShrink: 1,
    width: "100%",
    m: 0,
    overflowX: "auto"
  };

  const renderSeatMap = (groupPairs, mapType, title) => (
    <Card variant="outlined" sx={responsiveMapCardSx}>
      <CardContent>
        <Typography variant="subtitle2" align="center" gutterBottom fontWeight="medium">
          {title}
        </Typography>
        <Stack spacing={2}>
          {groupPairs.map((group, i) => (
            <Box key={i}>
              {group.map(([rowLabel, seats]) => (
                <Box key={rowLabel} mb={1} sx={{ width: "100%" }}>
                  <Typography variant="caption" fontWeight="medium">
                    {rowLabel} Row
                  </Typography>
                  <Stack direction="row" spacing={0.5} mt={0.5} sx={{ width: "100%" }}>
                    {seats.map((seat) => {
                      const isOccupied = isSeatOccupied(seat, mapType);
                      const seatColor = isOccupied ? red[400] : grey[50];
                      const barColor = isOccupied ? red[600] : grey[300];
                      const borderColor = isOccupied ? red[600] : barColor;
                      const textColor = isOccupied ? "#fff" : grey[900];
                      const tooltipTitle = isOccupied ? "Occupied seat" : "Vacant seat";

                      return (
                        <Tooltip key={seat.id} title={tooltipTitle} arrow>
                          <Box position="relative" mr={0.5}>
                            <Box
                              sx={{
                                ...responsiveSeatBoxSx,
                                bgcolor: seatColor,
                                color: textColor,
                                border: `1px solid ${borderColor}`,
                              }}
                            >
                              <Monitor size={10} style={{ marginBottom: 2 }} />
                              <span>{seat.number}</span>
                            </Box>
                            <Box
                              position="absolute"
                              top={0}
                              left={0}
                              width="100%"
                              height={2}
                              bgcolor={barColor}
                            />
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Stack>
                </Box>
              ))}
              {i < groupPairs.length - 1 && <Divider sx={{ my: 1 }} />}
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );

  // Render Private Office List
  const renderPrivateOffices = () => (
    <Card variant="outlined" sx={{ ...responsiveMapCardSx, maxWidth: 600, mx: "auto" }}>
      <CardContent>
        <Typography variant="h6" align="center" color={purple[800]} gutterBottom fontWeight="bold">
          Private Office Occupancy
        </Typography>
        <Divider sx={{ my: 1 }} />
        <List dense>
          {privateOfficeList.length === 0 ? (
            <ListItem>
              <ListItemText primary="No private office data found." />
            </ListItem>
          ) : (
            privateOfficeList.map((office, idx) => {
              const offices = Array.isArray(office.selectedPO)
                ? office.selectedPO
                : office.selectedPO
                ? [office.selectedPO]
                : [];
              return (
                <ListItem key={office.id} sx={{ py: 1 }}>
                  <MeetingRoomIcon sx={{ color: offices.length ? red[400] : grey[400], mr: 1 }} />
                  <ListItemText
                    primary={
                      <Box>
                        <Typography component="span" fontWeight="bold">
                          {office.name || `Office ${idx + 1}`}
                        </Typography>
                        {offices.length > 0 && (
                          <Typography
                            component="span"
                            sx={{ color: red[700], fontWeight: 700, ml: 2 }}
                          >
                            {offices.join(", ")}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={office.company ? `Tenant: ${office.company}` : null}
                  />
                </ListItem>
              );
            })
          )}
        </List>
        <Divider sx={{ my: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Occupied Offices: <b>{occupiedPrivateOffices.length}</b>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Last updated: {lastUpdated}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Occupancy Map
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Real-time view of all occupied seats and private offices
      </Typography>

      <Tabs
        value={tabIndex}
        onChange={(_, val) => setTabIndex(val)}
        sx={{ mb: 3 }}
        indicatorColor="primary"
        textColor="primary"
        variant="fullWidth"
      >
        <Tab label="Dedicated Desk" />
        <Tab label="Private Offices" />
      </Tabs>

      {tabIndex === 0 && (
        <>
          <Paper variant="outlined" sx={{ p: { xs: 1, sm: 3 }, mb: 3, borderRadius: 2 }}>
            <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
              <Chip
                icon={<Box sx={{ width: 14, height: 14, bgcolor: red[400], border: `1px solid ${red[600]}` }} />}
                label="Occupied seat"
                size="small"
              />
              <Chip
                icon={<Box sx={{ width: 14, height: 14, bgcolor: grey[50], border: `1px solid ${grey[300]}` }} />}
                label="Vacant seat"
                size="small"
              />
            </Stack>

            <Box sx={{ overflowX: "auto", py: 1, width: "100%" }}>
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  width: "100%",
                  flexWrap: { xs: "wrap", md: "nowrap" },
                  justifyContent: "center",
                  alignItems: "stretch"
                }}
              >
                {renderSeatMap(groupPairs1, "map1", "Seat Map 1")}
                {renderSeatMap(groupPairs2, "map2", "Seat Map 2")}
                {renderSeatMap(groupPairs3, "map3", "Seat Map 3")}
                {renderSeatMap(groupPairs4, "map4", "Seat Map 4")}
                {renderSeatMap(groupPairs5, "map5", "Seat Map 5")}
              </Stack>
            </Box>
          </Paper>

          <Card sx={{ bgcolor: blue[50], border: `1px solid ${blue[100]}` }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <InfoIcon color="primary" />
                <Typography variant="subtitle1" fontWeight="medium">
                  Occupancy Summary
                </Typography>
              </Stack>
              <Typography variant="body1">
                Total seats: <Box component="span" fontWeight="bold">{totalSeats}</Box>
              </Typography>
              <Typography variant="body1">
                Occupied seats: <Box component="span" fontWeight="bold">{occupiedSeats.length}</Box>
              </Typography>
              <Typography variant="body1">
                Available seats: <Box component="span" fontWeight="bold">{remainingSeats}</Box>
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Last updated: {lastUpdated}
              </Typography>
            </CardContent>
          </Card>
        </>
      )}

      {tabIndex === 1 && (
        <Box>
          {renderPrivateOffices()}
        </Box>
      )}
    </Box>
  );
}