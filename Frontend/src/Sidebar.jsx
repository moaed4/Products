// import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
// import { Dashboard, Inventory, Category } from '@mui/icons-material';

// export default function Sidebar({ open, onClose }) {
//   return (
//     // <Drawer
//     //   variant="persistent"
//     //   open={open}
//     //   onClose={onClose}
//     //   sx={{
//     //     width: 240,
//     //     flexShrink: 0,
//     //     '& .MuiDrawer-paper': {
//     //       width: 240,
//     //       boxSizing: 'border-box',
//     //     },
//     //   }}
//     // >
//     //   <Toolbar /> {/* For proper spacing under app bar */}
//     //   <List>
//     //     {['Dashboard', 'Products', 'Categories'].map((text, index) => (
//     //       <ListItem button key={text}>
//     //         <ListItemIcon>
//     //           {index === 0 ? <Dashboard /> : index === 1 ? <Inventory /> : <Category />}
//     //         </ListItemIcon>
//     //         <ListItemText primary={text} />
//     //       </ListItem>
//     //     ))}
//     //   </List>
//     // </Drawer>
//   );
// }