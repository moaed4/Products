// src/pages/ItemsPage.jsx
import { useState } from 'react';
import { Container, Grid } from '@mui/material';
import { useUser } from '@clerk/clerk-react';
import DataCard from '../components/DataCard';
import CreateButton from '../components/CreateButton';
import ItemFormDialog from '../components/ItemFormDialog';

export default function ItemsPage() {
  const { user } = useUser();
  const [items, setItems] = useState(sampleItems);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  const handleCreate = () => {
    setCurrentItem(null);
    setOpenDialog(true);
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setOpenDialog(true);
  };

  const handleDelete = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSubmit = (formData) => {
    if (currentItem) {
      // Update existing item
      setItems(items.map(item => 
        item.id === currentItem.id ? { ...item, ...formData } : item
      ));
    } else {
      // Create new item
      setItems([...items, { id: Date.now(), ...formData }]);
    }
    setOpenDialog(false);
  };

  return (
    <Container maxWidth="lg">
      <CreateButton onClick={handleCreate} />
      
      <Grid container spacing={2}>
        {items.map(item => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <DataCard 
              item={item} 
              onEdit={handleEdit} 
              onDelete={handleDelete} 
            />
          </Grid>
        ))}
      </Grid>

      <ItemFormDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleSubmit}
        initialValues={currentItem}
      />
    </Container>
  );
}

const sampleItems = [
  { id: 1, title: 'Item 1', description: 'Description for item 1' },
  { id: 2, title: 'Item 2', description: 'Description for item 2' },
];