import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Project, Task, User, TimeLog, TaskStatus, Location, PunchListItem, ProjectPhoto, InventoryItem, OrderListItem, InventoryOrderItem, ManualOrderItem, ProjectType, Invoice, Expense } from '../types';
import { setPhoto } from '../utils/db';
import { addDays, subDays } from 'date-fns';
import * as api from '../utils/api';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAyS8VmIL-AbFnpm_xmuKZ-XG8AmSA03AM'; // TODO: Move to environment variables

// Helper function to revive dates from JSON strings
const reviver = (key: string, value: any) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
        return new Date(value);
    }
    return value;
};

// Generic function to get item from localStorage
const getStoredItem = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        // If item doesn't exist, return the default value to populate the app
        if (item === null) {
            return defaultValue;
        }
        return JSON.parse(item, reviver);
    } catch (error) {
        console.error(`Error reading ${key} from localStorage`, error);
        return defaultValue;
    }
};

// Fetches the map image and converts it to a Data URL to embed it directly.
// This is more reliable for PDF generation as it avoids cross-origin issues.
const getMapImageDataUrl = async (location: Location): Promise<string | undefined> => {
    const url = `https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=15&size=200x150&markers=color:red%7C${location.lat},${location.lng}&key=${GOOGLE_MAPS_API_KEY}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to fetch map image: ${response.statusText}`);
            return undefined;
        }
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error fetching or converting map image:", error);
        return undefined;
    }
};

// --- DEFAULT DATA FOR PRE-LOADING THE APP ---
const defaultUsers: User[] = [
  {
    id: 1,
    name: 'Ryan',
    role: 'Installer',
    avatarUrl: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2E5YTlhOSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTguNjg1IDE5LjA5N0E5LjcyMyA5LjcyMyAwIDAwMjEuNzUgMTJjMC01LjM4NS00LjM2NS05Ljc1LTkuNzUtOS43NVMxLjI1IDYuNjE1IDEuMjUgMTJhOS43MjMgOS43MjMgMCAwMDMuMDY1IDcuMDk3QTkuNzE2IDkuNzE2IDAgMDAxMiAyMS43NWE5LjcxNiA5LjcxNiAwIDAwNi42ODUtMi42NTN6bS0xMi41NC0xLjI4NUE3LjQ4NiA3LjQ4NiAwIDAxMTIgMTVhNy40ODYgNy40ODYgMCAwMTUuODU1IDIuODEyQTguMjI0IDguMjI0IDAgMDExMiAyMC4yNWE4LjIyNCA4LjIyNCAwIDAxLTUuODU1LTIuNDM4ek0xNS43NSA5YTMuNzUgMy43NSAwIDExLTcuNSAwIDMuNzUgMy43NSAwIDAxNy41IDB6IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIC8+PC9zdmc+`,
    isClockedIn: false,
    hourlyRate: 25,
  }
];

const todayForDefaults = new Date();

const defaultProjects: Project[] = [
    {
        id: 1,
        name: 'Sally Wertman',
        address: '23296 US 12 W, Sturgis, MI 49091',
        type: ProjectType.Renovation,
        status: 'In Progress',
        startDate: subDays(todayForDefaults, 60),
        endDate: addDays(todayForDefaults, 90),
        budget: 150000,
        punchList: [
            { id: 1, text: 'Fix front door lock', isComplete: false },
            { id: 2, text: 'Paint trim in living room', isComplete: true },
            { id: 3, text: 'Repair drywall patch in hallway', isComplete: false },
        ],
        photos: [],
    },
    {
        id: 2,
        name: 'Tony Szafranski',
        address: '1370 E 720 S, Wolcottville, IN 46795',
        type: ProjectType.NewConstruction,
        status: 'In Progress',
        startDate: subDays(todayForDefaults, 45),
        endDate: addDays(todayForDefaults, 120),
        budget: 320000,
        punchList: [
             { id: 4, text: 'Install kitchen backsplash', isComplete: false },
        ],
        photos: [],
    },
    {
        id: 3,
        name: 'Joe Eicher',
        address: '6430 S 125 E, Wolcottville, IN 46795',
        type: ProjectType.InteriorFitOut,
        status: 'On Hold',
        startDate: subDays(todayForDefaults, 90),
        endDate: addDays(todayForDefaults, 60),
        budget: 75000,
        punchList: [],
        photos: [],
    },
    {
        id: 4,
        name: 'Tyler Mitchell',
        address: '785 E 660 S, Wolcottville, IN 46795',
        type: ProjectType.NewConstruction,
        status: 'In Progress',
        startDate: subDays(todayForDefaults, 15),
        endDate: addDays(todayForDefaults, 180),
        budget: 450000,
        punchList: [],
        photos: [],
    },
    {
        id: 5,
        name: 'Dennis Zmyslo',
        address: '260 Spring Beach Rd, Rome City, IN 46784',
        type: ProjectType.Renovation,
        status: 'Completed',
        startDate: subDays(todayForDefaults, 180),
        endDate: subDays(todayForDefaults, 10),
        budget: 95000,
        punchList: [],
        photos: [],
    },
    {
        id: 6,
        name: 'Stephanie Webster',
        address: '803 South Main Street, Topeka, IN 46571',
        type: ProjectType.Demolition,
        status: 'In Progress',
        startDate: subDays(todayForDefaults, 5),
        endDate: addDays(todayForDefaults, 25),
        budget: 25000,
        punchList: [],
        photos: [],
    }
];


interface DataContextType {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  authToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: { email: string; password: string; name: string; role: string; organizationName?: string }) => Promise<void>;

  // Data state
  users: User[];
  projects: Project[];
  tasks: Task[];
  timeLogs: TimeLog[];
  inventory: InventoryItem[];
  orderList: OrderListItem[];
  invoices: Invoice[];
  expenses: Expense[];
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  addUser: (user: { name: string; role: string; hourlyRate: number; }) => void;
  updateUser: (userId: number, data: Partial<Omit<User, 'id' | 'isClockedIn' | 'clockInTime' | 'currentProjectId'>>) => void;
  addProject: (project: Omit<Project, 'id' | 'punchList' | 'photos'>) => void;
  addTask: (task: Omit<Task, 'id' | 'status'>) => void;
  updateTaskStatus: (taskId: number, status: TaskStatus) => void;
  toggleClockInOut: (projectId?: number) => void;
  switchJob: (newProjectId: number) => void;
  addPunchListItem: (projectId: number, text: string) => void;
  togglePunchListItem: (projectId: number, itemId: number) => void;
  addPhoto: (projectId: number, imageDataUrls: string[], description: string) => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItemQuantity: (itemId: number, newQuantity: number) => void;
  updateInventoryItem: (itemId: number, data: Partial<Omit<InventoryItem, 'id' | 'quantity'>>) => void;
  addToOrderList: (itemId: number) => void;
  addManualItemToOrderList: (name: string, cost?: number) => void;
  removeFromOrderList: (item: OrderListItem) => void;
  clearOrderList: () => void;
  addInvoice: (invoiceData: Omit<Invoice, 'id'>) => Invoice;
  updateInvoice: (invoiceId: number, invoiceData: Omit<Invoice, 'id'>) => Invoice;
  deleteInvoice: (invoiceId: number) => void;
  addExpense: (expenseData: Omit<Expense, 'id'>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('auth_token'));

  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orderList, setOrderList] = useState<OrderListItem[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load data from API when authenticated
  const loadData = useCallback(async () => {
    if (!authToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const [usersData, projectsData, tasksData, timeLogsData, inventoryData, invoicesData, expensesData, userData] = await Promise.all([
        api.usersAPI.getAll(authToken).catch(() => []),
        api.projectsAPI.getAll(authToken).catch(() => []),
        api.tasksAPI.getAll(authToken).catch(() => []),
        api.timeLogsAPI.getAll(authToken).catch(() => []),
        api.inventoryAPI.getAll(authToken).catch(() => []),
        api.invoicesAPI.getAll(authToken).catch(() => []),
        api.expensesAPI.getAll(authToken).catch(() => []),
        api.authAPI.getCurrentUser(authToken).catch(() => null),
      ]);

      setUsers(usersData);
      setProjects(projectsData);
      setTasks(tasksData);
      setTimeLogs(timeLogsData);
      setInventory(inventoryData);
      setInvoices(invoicesData);
      setExpenses(expensesData);
      setCurrentUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error loading data:', error);
      // Token might be invalid
      setAuthToken(null);
      localStorage.removeItem('auth_token');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  // Load data when auth token changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Authentication functions
  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.authAPI.login({ email, password });
      const token = response.token;
      localStorage.setItem('auth_token', token);
      setAuthToken(token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setAuthToken(null);
    setIsAuthenticated(false);
    setCurrentUser(null);
    // Clear all data
    setUsers([]);
    setProjects([]);
    setTasks([]);
    setTimeLogs([]);
    setInventory([]);
    setOrderList([]);
    setInvoices([]);
    setExpenses([]);
  }, []);

  const register = useCallback(async (data: { email: string; password: string; name: string; role: string; organizationName?: string }) => {
    try {
      const response = await api.authAPI.register(data);
      const token = response.token;
      localStorage.setItem('auth_token', token);
      setAuthToken(token);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }, []);

  const addUser = useCallback(async ({ name, role, hourlyRate }: { name: string; role: string; hourlyRate: number; }) => {
    if (!authToken) return;
    try {
      const newUser = await api.usersAPI.create({ name, role, hourlyRate }, authToken);
      setUsers(prev => [...prev, newUser]);
    } catch (error) {
      console.error('Error adding user:', error);
    }
  }, [authToken]);

  const updateUser = useCallback((userId: number, data: Partial<Omit<User, 'id' | 'isClockedIn' | 'clockInTime' | 'currentProjectId'>>) => {
      let updatedUser: User | null = null;
      setUsers(prev => prev.map(user => {
          if (user.id === userId) {
              updatedUser = { ...user, ...data };
              return updatedUser;
          }
          return user;
      }));
      if (currentUser?.id === userId && updatedUser) {
          setCurrentUser(updatedUser);
      }
  }, [currentUser]);

  const addProject = useCallback(async (projectData: Omit<Project, 'id' | 'punchList' | 'photos'>) => {
    if (!authToken) return;
    try {
      const newProject = await api.projectsAPI.create({
        ...projectData,
        punchList: [],
        photos: []
      }, authToken);
      setProjects(prev => [...prev, newProject]);
    } catch (error) {
      console.error('Error adding project:', error);
    }
  }, [authToken]);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'status'>) => {
    setTasks(prev => {
        const newTask: Task = {
            ...taskData,
            id: Math.max(0, ...prev.map(t => t.id)) + 1,
            status: TaskStatus.ToDo,
        };
        return [...prev, newTask]
    });
  }, []);

  const updateTaskStatus = useCallback((taskId: number, status: TaskStatus) => {
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, status } : task));
  }, []);

  const getCurrentLocation = useCallback((): Promise<Location | undefined> => {
      return new Promise((resolve) => {
          if (!navigator.geolocation) { 
            console.warn("Geolocation is not supported by this browser.");
            resolve(undefined);
            return;
           }
          navigator.geolocation.getCurrentPosition(
              (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
              (error) => {
                console.error("Error getting location:", error);
                alert(`Could not get location: ${error.message}`);
                resolve(undefined);
              }
          );
      });
  }, []);

  const toggleClockInOut = useCallback(async (projectId?: number) => {
    if (!currentUser) return;

    if (currentUser.isClockedIn) {
      const location = await getCurrentLocation();
      const clockInTime = currentUser.clockInTime;
      if (!clockInTime) return;
      
      const existingLogIndex = timeLogs.findIndex(log => log.userId === currentUser.id && !log.clockOut);
      if (existingLogIndex === -1) return;

      const now = new Date();
      const durationMs = now.getTime() - clockInTime.getTime();
      const hoursWorked = durationMs / (1000 * 60 * 60);
      const cost = hoursWorked * currentUser.hourlyRate;
      const mapImageUrl = location ? await getMapImageDataUrl(location) : undefined;
      
      const updatedLog: TimeLog = { 
        ...timeLogs[existingLogIndex], 
        clockOut: now, 
        durationMs, 
        cost, 
        clockOutLocation: location,
        clockOutMapImage: mapImageUrl
      };
      const newTimeLogs = [...timeLogs];
      newTimeLogs[existingLogIndex] = updatedLog;

      setTimeLogs(newTimeLogs.sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime()));
      
      const updatedUser = { ...currentUser, isClockedIn: false, clockInTime: undefined, currentProjectId: undefined };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    } else {
      if (!projectId) return;
      const location = await getCurrentLocation();
      const mapImageUrl = location ? await getMapImageDataUrl(location) : undefined;
      const clockInTime = new Date();
      const updatedUser = { ...currentUser, isClockedIn: true, clockInTime, currentProjectId: projectId };
      
      const newLog: TimeLog = { 
        id: Math.max(0, ...timeLogs.map(l => l.id)) + 1, 
        userId: currentUser.id, 
        projectId: projectId, 
        clockIn: clockInTime, 
        clockInLocation: location,
        clockInMapImage: mapImageUrl
      };
      setTimeLogs(prev => [newLog, ...prev]);

      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    }
  }, [currentUser, timeLogs, getCurrentLocation]);

  const switchJob = useCallback(async (newProjectId: number) => {
    if (!currentUser || !currentUser.isClockedIn) return;
    if (newProjectId === currentUser.currentProjectId) return;

    // Step 1: Clock out from the current job.
    const location = await getCurrentLocation();
    const clockInTime = currentUser.clockInTime;
    if (!clockInTime) return;
    
    const existingLogIndex = timeLogs.findIndex(log => log.userId === currentUser.id && !log.clockOut);
    if (existingLogIndex === -1) return;

    const now = new Date();
    const durationMs = now.getTime() - clockInTime.getTime();
    const hoursWorked = durationMs / (1000 * 60 * 60);
    const cost = hoursWorked * currentUser.hourlyRate;
    const mapImageUrl = location ? await getMapImageDataUrl(location) : undefined;
    
    const updatedLog: TimeLog = { 
      ...timeLogs[existingLogIndex], 
      clockOut: now, 
      durationMs, 
      cost, 
      clockOutLocation: location,
      clockOutMapImage: mapImageUrl
    };
    
    const tempTimeLogs = [...timeLogs];
    tempTimeLogs[existingLogIndex] = updatedLog;

    // Step 2: Clock in to the new job immediately.
    const newLocation = await getCurrentLocation();
    const newMapImageUrl = newLocation ? await getMapImageDataUrl(newLocation) : undefined;
    const newClockInTime = new Date(); // Use a fresh timestamp for accuracy
    const updatedUser = { ...currentUser, isClockedIn: true, clockInTime: newClockInTime, currentProjectId: newProjectId };
    const newLog: TimeLog = { 
      id: Math.max(0, ...tempTimeLogs.map(l => l.id)) + 1, 
      userId: currentUser.id, 
      projectId: newProjectId, 
      clockIn: newClockInTime, 
      clockInLocation: newLocation,
      clockInMapImage: newMapImageUrl
    };
    
    setTimeLogs([newLog, ...tempTimeLogs].sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime()));
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
  }, [currentUser, timeLogs, getCurrentLocation]);

  const addPunchListItem = useCallback((projectId: number, text: string) => {
    setProjects(prevProjects => {
        // Find the highest existing ID across all punch lists in all projects.
        const allItems = prevProjects.flatMap(p => p.punchList);
        const nextId = Math.max(0, ...allItems.map(item => item.id)) + 1;

        // Create the new item with a globally unique ID.
        const newItem: PunchListItem = {
            id: nextId,
            text,
            isComplete: false,
        };

        // Update only the target project's punch list.
        return prevProjects.map(p =>
            p.id === projectId
                ? { ...p, punchList: [...p.punchList, newItem] }
                : p
        );
    });
  }, []);

  const togglePunchListItem = useCallback((projectId: number, itemId: number) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, punchList: p.punchList.map(item => item.id === itemId ? { ...item, isComplete: !item.isComplete } : item) } : p));
  }, []);

  const addPhoto = useCallback(async (projectId: number, imageDataUrls: string[], description: string) => {
    setProjects(prev => {
        const project = prev.find(p => p.id === projectId);
        if (!project) return prev;
    
        const dateAdded = new Date();
        let nextId = Math.max(0, ...project.photos.map(p => p.id)) + 1;
        
        const newPhotos: Omit<ProjectPhoto, 'imageDataUrl'>[] = [];
        
        imageDataUrls.forEach((url) => {
            const photoId = nextId++;
            const newPhoto: Omit<ProjectPhoto, 'imageDataUrl'> = {
              id: photoId,
              description,
              dateAdded, // same timestamp for the batch
            };
            newPhotos.push(newPhoto);
    
            setPhoto(projectId, newPhoto.id, url).catch(e => {
                console.error("Failed to add photo", e);
                alert("There was an error saving the photo. The storage might be full.");
            });
        });

        const updatedPhotos = [...newPhotos, ...project.photos];

        return prev.map(p => p.id === projectId ? { ...p, photos: updatedPhotos } : p);
    });
  }, []);

  const addInventoryItem = useCallback((itemData: Omit<InventoryItem, 'id'>) => {
    setInventory(prev => {
        const newItem: InventoryItem = {
            ...itemData,
            id: Math.max(0, ...prev.map(i => i.id)) + 1,
        };
        return [...prev, newItem].sort((a,b) => a.name.localeCompare(b.name));
    });
  }, []);

  const updateInventoryItemQuantity = useCallback((itemId: number, newQuantity: number) => {
      setInventory(prev => prev.map(item => item.id === itemId ? { ...item, quantity: Math.max(0, newQuantity) } : item));
  }, []);

  const updateInventoryItem = useCallback((itemId: number, data: Partial<Omit<InventoryItem, 'id' | 'quantity'>>) => {
    setInventory(prev => prev.map(item => item.id === itemId ? { ...item, ...data } : item));
  }, []);

  const addToOrderList = useCallback((itemId: number) => {
    setOrderList(prev => {
        const exists = prev.some(item => item.type === 'inventory' && item.itemId === itemId);
        if (exists) return prev;
        const newItem: InventoryOrderItem = { type: 'inventory', itemId };
        return [...prev, newItem];
    });
  }, []);

  const addManualItemToOrderList = useCallback((name: string, cost?: number) => {
    setOrderList(prev => {
        const manualOrderItems = prev.filter(item => item.type === 'manual') as ManualOrderItem[];
        const newId = Math.max(0, ...manualOrderItems.map(i => i.id)) + 1;
        const newItem: ManualOrderItem = { type: 'manual', id: newId, name, cost };
        return [...prev, newItem];
    });
  }, []);

  const removeFromOrderList = useCallback((itemToRemove: OrderListItem) => {
    setOrderList(prev => prev.filter(item => {
        if (item.type !== itemToRemove.type) return true;
        if (item.type === 'inventory' && itemToRemove.type === 'inventory') {
            return item.itemId !== itemToRemove.itemId;
        }
        if (item.type === 'manual' && itemToRemove.type === 'manual') {
            return item.id !== itemToRemove.id;
        }
        return true;
    }));
  }, []);

  const clearOrderList = useCallback(() => {
    setOrderList([]);
  }, []);

  const addInvoice = useCallback((invoiceData: Omit<Invoice, 'id'>) => {
    let newInvoice: Invoice | null = null;
    setInvoices(prev => {
        const nextId = Math.max(0, ...prev.map(i => i.id)) + 1;
        newInvoice = {
            ...invoiceData,
            id: nextId,
        };
        return [...prev, newInvoice].sort((a, b) => b.dateIssued.getTime() - a.dateIssued.getTime());
    });

    const timeLogIdsToUpdate = invoiceData.lineItems.flatMap(item => item.timeLogIds || []);
    if (timeLogIdsToUpdate.length > 0 && newInvoice) {
        setTimeLogs(prev => prev.map(log => 
            timeLogIdsToUpdate.includes(log.id) ? { ...log, invoiceId: newInvoice!.id } : log
        ));
    }
    return newInvoice!;
  }, []);

  const updateInvoice = useCallback((invoiceId: number, invoiceData: Omit<Invoice, 'id'>) => {
    let updatedInvoice: Invoice | null = null;
    setTimeLogs(prevTimeLogs => {
        const originalInvoice = invoices.find(inv => inv.id === invoiceId);
        const originalTimeLogIds = originalInvoice?.lineItems.flatMap(item => item.timeLogIds || []) || [];
        const newTimeLogIds = invoiceData.lineItems.flatMap(item => item.timeLogIds || []);

        return prevTimeLogs.map(log => {
            if (originalTimeLogIds.includes(log.id) && !newTimeLogIds.includes(log.id)) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { invoiceId, ...rest } = log;
                return rest;
            }
            if (newTimeLogIds.includes(log.id)) {
                return { ...log, invoiceId: invoiceId };
            }
            return log;
        });
    });

    setInvoices(prev => {
        return prev.map(inv => {
            if (inv.id === invoiceId) {
                updatedInvoice = { ...invoiceData, id: invoiceId };
                return updatedInvoice;
            }
            return inv;
        }).sort((a, b) => b.dateIssued.getTime() - a.dateIssued.getTime());
    });
    return updatedInvoice!;
  }, [invoices]);

  const deleteInvoice = useCallback((invoiceId: number) => {
    const invoiceToDelete = invoices.find(inv => inv.id === invoiceId);
    const timeLogIdsToUnbill = invoiceToDelete?.lineItems.flatMap(item => item.timeLogIds || []) || [];
    
    if (timeLogIdsToUnbill.length > 0) {
        setTimeLogs(prev => prev.map(log => {
            if (timeLogIdsToUnbill.includes(log.id)) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { invoiceId, ...rest } = log;
                return rest;
            }
            return log;
        }));
    }

    setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
  }, [invoices]);

  const addExpense = useCallback((expenseData: Omit<Expense, 'id'>) => {
    setExpenses(prev => {
        const newExpense: Expense = {
            ...expenseData,
            id: Math.max(0, ...prev.map(e => e.id)) + 1,
        };
        return [...prev, newExpense].sort((a, b) => b.date.getTime() - a.date.getTime());
    });
  }, []);


  const value = useMemo(() => ({
      // Auth state
      isAuthenticated, isLoading, authToken, login, logout, register,

      // Data state
      users, projects, tasks, timeLogs, inventory, orderList, currentUser, invoices, expenses,
      setCurrentUser, addUser, updateUser, addProject, addTask, updateTaskStatus,
      toggleClockInOut, switchJob, addPunchListItem, togglePunchListItem, addPhoto,
      addInventoryItem, updateInventoryItemQuantity, updateInventoryItem, addToOrderList,
      addManualItemToOrderList, removeFromOrderList, clearOrderList,
      addInvoice, updateInvoice, deleteInvoice, addExpense,
  }), [
      isAuthenticated, isLoading, authToken, login, logout, register,
      users, projects, tasks, timeLogs, inventory, orderList, currentUser, invoices, expenses,
      addUser, updateUser, addProject, addTask, updateTaskStatus, toggleClockInOut,
      switchJob, addPunchListItem, togglePunchListItem, addPhoto, addInventoryItem,
      updateInventoryItemQuantity, updateInventoryItem, addToOrderList, addManualItemToOrderList,
      removeFromOrderList, clearOrderList, addInvoice, updateInvoice, deleteInvoice, addExpense
  ]);

  return React.createElement(DataContext.Provider, { value }, children);
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) { throw new Error('useData must be used within a DataProvider'); }
  return context;
};