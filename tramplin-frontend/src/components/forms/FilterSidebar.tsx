import React, { useState } from 'react';
import {
  Box,
  Typography,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
  TextField,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import toast from 'react-hot-toast';

interface Filters {
  search?: string;
  skills?: string[];
  salaryMin?: number;
  salaryMax?: number;
  workFormat?: string[];
  type?: string[];
}

interface FilterSidebarProps {
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ filters, onFilterChange }) => {
  const [salaryRange, setSalaryRange] = useState<number[]>([filters.salaryMin || 0, filters.salaryMax || 500000]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(filters.skills || []);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(filters.workFormat || []);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(filters.type || []);

  const popularSkills = ['Python', 'JavaScript', 'Java', 'SQL', 'React', 'Node.js', 'C++', 'TypeScript', 'Go', 'Rust'];
  const workFormats = [
    { value: 'office', label: 'В офисе' },
    { value: 'hybrid', label: 'Гибрид' },
    { value: 'remote', label: 'Удаленно' },
  ];
  const opportunityTypes = [
    { value: 'job', label: 'Вакансия' },
    { value: 'internship', label: 'Стажировка' },
    { value: 'mentorship', label: 'Менторство' },
    { value: 'event', label: 'Мероприятие' },
  ];

  const handleSkillToggle = (skill: string) => {
    const newSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter(s => s !== skill)
      : [...selectedSkills, skill];
    setSelectedSkills(newSkills);
    onFilterChange({ skills: newSkills });
    toast.success(`Фильтр по навыку ${skill} ${newSkills.includes(skill) ? 'применен' : 'удален'}`);
  };

  const handleFormatChange = (format: string) => {
    const newFormats = selectedFormats.includes(format)
      ? selectedFormats.filter(f => f !== format)
      : [...selectedFormats, format];
    setSelectedFormats(newFormats);
    onFilterChange({ workFormat: newFormats });
  };

  const handleTypeChange = (type: string) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    setSelectedTypes(newTypes);
    onFilterChange({ type: newTypes });
  };

  const handleSalaryChange = (_event: Event, newValue: number | number[]) => {
    setSalaryRange(newValue as number[]);
  };

  const handleSalaryChangeCommitted = () => {
    onFilterChange({ salaryMin: salaryRange[0], salaryMax: salaryRange[1] });
    toast.success(`Диапазон зарплаты: ${salaryRange[0].toLocaleString()} - ${salaryRange[1].toLocaleString()} ₽`);
  };

  const handleClearFilters = () => {
    setSelectedSkills([]);
    setSelectedFormats([]);
    setSelectedTypes([]);
    setSalaryRange([0, 500000]);
    onFilterChange({
      skills: [],
      workFormat: [],
      type: [],
      salaryMin: 0,
      salaryMax: 500000,
      search: '',
    });
    toast.success('Все фильтры сброшены');
  };

  return (
    <Box>
      {/* Убираем лишний заголовок "Фильтры" - он будет добавлен в родительском компоненте */}
      
      {/* Salary range */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Зарплата</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Slider
            value={salaryRange}
            onChange={handleSalaryChange}
            onChangeCommitted={handleSalaryChangeCommitted}
            valueLabelDisplay="auto"
            min={0}
            max={500000}
            step={10000}
            valueLabelFormat={(value) => `${value.toLocaleString()} ₽`}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2">{salaryRange[0].toLocaleString()} ₽</Typography>
            <Typography variant="body2">{salaryRange[1].toLocaleString()} ₽</Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Skills */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Навыки</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {popularSkills.map((skill) => (
              <Chip
                key={skill}
                label={skill}
                onClick={() => handleSkillToggle(skill)}
                color={selectedSkills.includes(skill) ? 'primary' : 'default'}
                variant={selectedSkills.includes(skill) ? 'filled' : 'outlined'}
                size="small"
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Work format */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Формат работы</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormGroup>
            {workFormats.map((format) => (
              <FormControlLabel
                key={format.value}
                control={
                  <Checkbox
                    checked={selectedFormats.includes(format.value)}
                    onChange={() => handleFormatChange(format.value)}
                    size="small"
                  />
                }
                label={format.label}
              />
            ))}
          </FormGroup>
        </AccordionDetails>
      </Accordion>

      {/* Opportunity type */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Тип</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormGroup>
            {opportunityTypes.map((type) => (
              <FormControlLabel
                key={type.value}
                control={
                  <Checkbox
                    checked={selectedTypes.includes(type.value)}
                    onChange={() => handleTypeChange(type.value)}
                    size="small"
                  />
                }
                label={type.label}
              />
            ))}
          </FormGroup>
        </AccordionDetails>
      </Accordion>

      {/* Clear filters */}
      <Button
        fullWidth
        variant="outlined"
        onClick={handleClearFilters}
        sx={{ mt: 2 }}
      >
        Сбросить все фильтры
      </Button>
    </Box>
  );
};

export default FilterSidebar;